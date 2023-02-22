<script setup>
const props = defineProps({
  movie: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["watched"]);

function markAsWatched() {
  emit("watched", props.movie.id);
}
</script>

<template>
  <div class="flex space-x-4 bg-slate-300 p-2 relative">
    <div class="w-1/3">
      <img
        :src="props.movie.poster"
        :alt="props.movie.name"
        class="rounded-sm"
      />
    </div>
    <div class="w-full">
      <ul class="flex flex-col space-y-1">
        <li class="text-2xl font-semibold">
          {{ props.movie.title }} ({{ props.movie.year }})
        </li>
        <li class="font-semibold">{{ props.movie.genres }}</li>
        <li class="text-lg font-semibold">{{ props.movie.run_time }}</li>
        <li class="text-lg font-semibold">{{ props.movie.rated }}</li>
        <li>
          <button
            title="Mark movie as watched"
            class="p-1 rounded text-sm bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 active:text-white text-wh font-semibold"
            @click="markAsWatched()"
          >
            Mark as watched!
          </button>
        </li>
        <li class="text-lg">{{ props.movie.plot }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
