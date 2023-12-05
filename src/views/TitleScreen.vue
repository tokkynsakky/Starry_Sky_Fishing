<template>
  <div class="title-screen">
    <!-- <router-link to="/main">Go to Main Screen</router-link> -->

    <h1>{{ title }}</h1>
    <p>{{ subtitle }}</p>
    <button @click="startGame">はじめる</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      title: "星ストーリー(仮)",
      subtitle: "⭐️星座釣り体験⭐️",
    };
  },
  methods: {
    startGame(event: MouseEvent) {
      console.log(this.$router);
      this.$router.push("/main");
    },
  },
});
</script>

<style scoped>
.title-screen {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: url("../assets/starrySky3.jpg"); /* Replace with your star image path */
  color: #ffffff; /* White text color */
  overflow: hidden; /* Prevent stars from overflowing the container */
}

h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  background-color: #001d3d;
}

p {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: #001d3d;
}

button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background-color: #ffd700; /* Gold button color */
  color: #001d3d; /* Deep blue text color */
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #ffc800; /* Darker gold on hover */
}
</style>
