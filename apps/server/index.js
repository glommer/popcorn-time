const dotenv = require("dotenv");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { connect, Connection } = require("@libsql/client");
dotenv.config({
  path: path.resolve(__dirname, ".env"),
});

const app = express();

// Environment
const port = process.env.PORT || 3001;
const dbUrl = process.env.LIBSQL_URL;
const omdbApiKey = process.env.OMDB_API_KEY;
const omdbAPIUrl = process.env.OMDB_URL;
const moviesApi = `${omdbAPIUrl}?apikey=${omdbApiKey}`;

// Database connection
const config = {
  url: dbUrl,
};
const client = connect(config);

const omdbSeedingMovieIds = [
  "tt16280138",
  "tt1630029",
  "tt18079362",
  "tt3915174",
  "tt15679400",
  "tt7405458",
  "tt10855768",
  "tt8760708",
  "tt5884796",
  "tt22488024",
];

/* Helper functions start */

/***
 * @description Gets movies based on provided IMDB movie id
 * @param {String} movieId - IMDB movie id
 * @returns { Object | null }
 */
async function getMovieByIMDBId(movieId) {
  if (!movieId) throw "Missing arguments";

  try {
    const data = await fetch(`${moviesApi}&i=${movieId}`);
    const movie = await data.json();
    return movie.Response === "False" ? null : movie;
  } catch (error) {
    console.log({ error });
    return null;
  }
}

/**
 * @description Submits a movie row into the movies table.
 * @param {Object} movie - Movie data
 * @returns {Promise}
 */
async function addMovieInfoToDatabase(movie) {
  const {
    Title: title,
    Year: year,
    Rated: rated,
    Runtime: run_time,
    Plot: plot,
    Genre: genres,
    Poster: poster,
  } = movie;
  const movieAddQuery = `insert into movies(title, year, rated, run_time, plot, genres, poster) values(?, ?, ?, ?, ?, ?, ?)`;
  return client.execute(movieAddQuery, [
    title,
    year,
    rated,
    run_time,
    plot,
    genres,
    poster,
  ]);
}

/***
 * @description Adapter for formating db query results to proper objects for json responses
 * @param {Object} data - Db query response data
 *
 */
function responseDataAdapter(data) {
  if (!data?.columns || !data?.rows) {
    return data;
  }

  const { columns, rows } = data;
  const formattedData = [];

  for (const row of rows) {
    const rowData = {};
    for (const key of columns.keys()) {
      rowData[columns[key]] = row[key];
    }
    formattedData.push(rowData);
  }

  return formattedData;
}

/* Helper functions end */

// Apply plugins
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * @description The index route
 */
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Popcorn Time 2023.",
  });
});

// add routes
app.use("/init", async function (req, res) {
  const movieTableCreationQuery = `create table if not exists movies(
      id integer primary key,
      title varchar(255), 
      year integer default 2023,
      rated varchar(20),
      run_time varchar(20) default '120 min',
      plot text, genres varchar(255),
      poster varchar(255),
      watched boolean default false
		)
    `;
  await client.execute(movieTableCreationQuery);
  const seeAvailableTables = await client.execute(
    "select name from sqlite_schema where name not like 'libsql%'"
  );
  return res.status(200).json(seeAvailableTables);
});

/**
 * @description Database data seeding route, responds to /seed post requests
 * and adds a finite number of movies to the database.
 * @returns {JSON}
 */
app.use("/seed", async function (req, res) {
  const getMovies = omdbSeedingMovieIds.map((id) =>
    fetch(`${moviesApi}&i=${id}`)
      .then((res) => res.json())
      .then((data) => data)
  );
  let responsePayload;
  try {
    // fetch movies from OMDB API
    const moviesList = await Promise.all(getMovies);

    // Populate db
    for (const movie of moviesList) {
      await addMovieInfoToDatabase(movie, client);
    }
    const fetchAllMoviesQuery = "select * from movies";
    const results = await client.execute(fetchAllMoviesQuery);
    responsePayload = `Added ${results.rows?.length} movies!`;
  } catch (error) {
    responsePayload = null;
  }

  res.json(responsePayload);
});

/**
 * @description Route responding to `/add` post requests
 * @returns {JSON}
 */
app.use("/add", async function (req, res) {
  const { imdbId } = req.body;
  let responsePayload;

  if (!imdbId) {
    return res.status(422).json("imdbId is missing!");
  }

  try {
    // get movie data
    const movieInfo = await getMovieByIMDBId(imdbId);
    if (!movieInfo) {
      return res.status(404).json("Movie not available");
    }

    // Populate db
    const response = await addMovieInfoToDatabase(movieInfo, client);
    responsePayload = response?.success
      ? "Added movie"
      : "Movie not added";
  } catch (error) {
    console.log({ error });
    responsePayload = null;
  }

  return res.json(responsePayload);
});

/**
 * @description Route responding to /update-movie post requests
 * @returns {JSON}
 */
app.use("/update", async function (req, res) {
  const { movieId, watched } = req.body;
  let responsePayload;
  const watchedInt = watched ? 1 : 0;

  try {
    const movieWatchStateUpdateQuery =
      "update movies set watched = ? where id = ?";
    const response = await client.execute(movieWatchStateUpdateQuery, [
      watchedInt,
      movieId,
    ]);
    responsePayload = response.success
      ? "Movie updated"
      : "Failed to update movie";
  } catch (error) {
    console.log({ error });
    responsePayload = null;
  }

  return res.json(responsePayload);
});

/**
 * @description Route responding to /delete-movie post requests
 * @returns {JSON}
 */
app.use("/delete", async function (req, res) {
  const { movieId } = req.body;
  let responsePayload;

  try {
    const movieDeleteQuery = "delete from movies where id = ?";
    const response = await client.execute(movieDeleteQuery, [movieId]);
    responsePayload = response?.success
      ? "Movie deleted"
      : "Failed to delete movie";
  } catch (error) {
    console.log({ error });
    responsePayload = null;
  }

  return res.json(responsePayload);
});

/**
 * @description Route responding to `/all-movies`  get requests,
 * returns the list of movies that have not been watched.
 * @returns {JSON}
 */
app.use("/movies", async function (req, res) {
  let responsePayload;
  try {
    const unwatchedMoviesSelectQuery =
      "select * from movies where watched = false order by id desc";
    responsePayload = await client.execute(unwatchedMoviesSelectQuery);
  } catch (error) {
    console.log({ error });
    responsePayload = null;
  }

  return res.json(responseDataAdapter(responsePayload));
});

app.use("/search", async function (req, res) {
  const { query } = req.query;
  let responsePayload;

  try {
    const unwatchedMoviesSearchQuery =
      "select * from movies where watched = false and (title like ? or year like ? or plot like ?)";
    const searchResult = await client.execute(
      unwatchedMoviesSearchQuery,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    responsePayload = searchResult?.rows?.length ? searchResult : null;
  } catch (error) {
    console.log({ error });
    responsePayload = null;
  }

  return res.json(responseDataAdapter(responsePayload));
});

app.listen(port, () => console.log("running server on " + port));
