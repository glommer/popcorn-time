<script setup>
import axios from "axios";
import { onMounted, ref, watch } from "vue";
import MovieCard from "./components/MovieCard.vue";

let allMovies = ref([]),
  tempStorage = ref([]),
  query = ref(""),
  formActionType = ref("search"),
  loading = ref(false);
const apiUrl = import.meta.env.VITE_API_URL;

/**
 * @description Fetches movies and updates the value of [allMovies]
 */
async function fetchMovies() {
  loading.value = true;
  try {
    const { data } = await axios.get(`${apiUrl}/movies`);
    allMovies.value = data;
    tempStorage.value = [].concat(data);
  } catch (error) {
    console.log(error?.response.data || error.message);
  } finally {
    loading.value = false;
  }
}

/**
 * @description Fetch movies on component mount
 */
onMounted(() => {
  fetchMovies();
});

/**
 * @description Searches for movies or adds new movies depending on the state of [formActionType]
 */
async function formAction() {
  if (query.value.length < 2) {
    alert("Please add more to search term!");
    return false;
  }
  loading.value = true;
  try {
    const { data } =
      formActionType.value === "search"
        ? await axios.get(`${apiUrl}/search?query=${query.value}`)
        : await axios.post(`${apiUrl}/add`, { imdbId: query.value });

    if (formActionType.value === "search") {
      allMovies.value = data;
      return;
    }
    fetchMovies();
    query.value = "";
  } catch (error) {
    console.log(error?.response.data || error.message);
  } finally {
    loading.value = false;
  }
}

/**
 * @description Marks movie as watched & calls fetchMovies()
 */
async function watched(movieId) {
  if (!movieId) {
    return false;
  }
  loading.value = true;
  try {
    const { data } = await axios.post(`${apiUrl}/update`, {
      movieId,
      watched: true,
    });
    if (data === "Movie updated") {
      fetchMovies();
    }
  } catch (error) {
    console.log(error?.response.data || error.message);
  } finally {
    loading.value = false;
  }
}

/***
 * @description Repopulate [allMovies] when the search query has been cleared
 */
watch(query, function (query) {
  if (query === "") {
    allMovies.value = [].concat(tempStorage.value);
  }
});
</script>

<template>
  <header>
    <h1
      class="flex bg-slate-700 text-orange-500 font-semibold justify-center p-2 text-3xl py-4"
    >
      Popcorn Time
    </h1>
  </header>
  <main class="flex flex-col px-8 pb-4">
    <div class="flex p-4 relative">
      <form
        class="flex space-x-2 mx-8 text-xl w-full"
        @submit.prevent="formAction()"
      >
        <select
          v-model="formActionType"
          class="flex p-3 border border-gray-300 outline-1 outline-orange-300 rounded-l-full"
          title="Select action type"
        >
          <option value="search" :selected="formActionType === 'search'">
            Search
          </option>
          <option value="new movie" :selected="formActionType === 'new movie'">
            Add Movie
          </option>
        </select>

        <input
          v-model="query"
          :placeholder="
            formActionType === 'search' ? 'Enter search query' : 'IMDB movie Id'
          "
          type="text"
          :class="{ loading: loading }"
          class="rounded-r-full p-3 mx-8 text-xl w-full border border-gray-300 outline-1 outline-orange-300"
        />
      </form>
    </div>
    <div v-if="allMovies?.length" class="flex flex-col space-y-2">
      <MovieCard
        v-for="(movie, key) in allMovies"
        :key="key"
        :movie="movie"
        @watched="watched"
      ></MovieCard>
    </div>
    <div v-else class="flex justify-center p-4 text-xl font-semibold">
      <p>No movies{{ query ? " found!" : "!" }}</p>
    </div>
  </main>
</template>

<style scoped>
.loading {
  animation: animate-search 1s infinite;
}

@keyframes animate-search {
  0% {
    outline: 1px orange solid;
  }
  50% {
    outline: 1px blueviolet solid;
  }
  1000% {
    outline: 1px orange solid;
  }
}
</style>
