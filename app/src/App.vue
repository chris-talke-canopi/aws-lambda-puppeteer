<script setup>
import { ref } from "vue";

import ExportWizard from './components/ExportWizard.vue'
import JobViewer from './components/JobViewer.vue'

const currentWindow = ref('WIZARD');

function switchWindow(window) {
  currentWindow.value = window;
}
</script>

<template>
  <div>
    <h1>Bulk Export Debugging Tool</h1>
    <nav>
      <ul>
        <li @click="switchWindow('WIZARD')" :class="`${currentWindow === 'WIZARD' ? 'active' : ''}`">Export Wizard</li>
        <li @click="switchWindow('JOBS')" :class="`${currentWindow === 'JOBS' ? 'active' : ''}`">Job Viewer</li>
      </ul>
    </nav>
    <ExportWizard v-if="currentWindow === 'WIZARD'" />
    <JobViewer v-if="currentWindow === 'JOBS'" />
  </div>
</template>

<style scoped>
  h1 {
    padding: 0;
    margin: 0;
    margin-bottom: 8px;
  }

  ul {
    display: flex;
    flex-direction: row;
    gap: 4px;
    margin: 0;
    padding: 0; 
  }

  li {
    list-style: none;
    border-radius: 4px;
    border: 1px solid rgb(172, 172, 172);
    padding: 4px 8px;
  }
  
  li:hover {
    background: rgb(172, 172, 172);
    cursor: pointer;
  }

  li.active {
    color: white;
    background: rgb(22, 22, 22);
  }

  nav {
    margin-bottom: 4px;
  }
</style>
