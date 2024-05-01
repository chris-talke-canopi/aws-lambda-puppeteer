<script setup>
import { ref, onMounted } from "vue";
import { api } from "../api/api";

const folders = ref([]);
const selectedFolder = ref("");
const selectedCourses = ref([]);
const modalStatus = ref(false);

onMounted(async () => {
    await syncRiseData(true)
});

async function syncRiseData(status) {
    const data = await api.getCourses(status);
    folders.value = data;
    selectedFolder.value = 0;
}

function selectFolder(folder) {
    selectedFolder.value = folder;
}

function addCourse(addedCourse) {
    const isCourseSelected = selectedCourses.value.find((course) => course.id === addedCourse.id);
    if (isCourseSelected) return;

    selectedCourses.value = [...selectedCourses.value, addedCourse];
}

function removeCourse(courseId) {
    selectedCourses.value = selectedCourses.value.filter((course) => course.id !== courseId);
}

function toggleModal(newStatus) {
    if (selectedCourses.value.length === 0) return;
    modalStatus.value = newStatus
}

async function confirmExportJob() {
    toggleModal(false);
    const payload = {
        environment: "acme",
        courses: selectedCourses.value.map(course => {
            return {
                id: course.id,
                name: course.title
            }
        }),
        username: "acme",
        password: "acme"
    }
    const response = await api.sendBatchJob(payload);

    if (response) selectedCourses.value = [];

    return;
}
</script>

<template>
    <main>
        <div class="selection_screen border">
            <section class="folders border seperate">
                <div>
                    <h1>RISE Folders</h1>
                    <ul class="selector">
                        <li v-for="(folder, index) in folders" :key="folder.id" :class="`selectors${selectedFolder === index ? ' active' : ''}`" @click="selectFolder(index)">
                            <div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="icon icon-tabler icon-tabler-folder"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    stroke-width="1.5"
                                    stroke="#000000"
                                    fill="none"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
                                </svg>
                                <span>{{ folder.name }}</span>
                            </div>
                        </li>
                    </ul>
                </div>
                <button @click="syncRiseData(false)">Start Sync</button>
            </section>

            <section class="COURSES border seperate">
                <div>
                    <h1>Course List</h1>
                    <ul v-if="folders" class="selector">
                        <li v-for="course of folders[selectedFolder]?.items" :key="course.id" @click="addCourse(course)" class="selectors">
                            <div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="icon icon-tabler icon-tabler-certificate"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    stroke-width="1.5"
                                    stroke="#000000"
                                    fill="none"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M15 15m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                                    <path d="M13 17.5v4.5l2 -1.5l2 1.5v-4.5" />
                                    <path d="M10 19h-5a2 2 0 0 1 -2 -2v-10c0 -1.1 .9 -2 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -1 1.73" />
                                    <path d="M6 9l12 0" />
                                    <path d="M6 12l3 0" />
                                    <path d="M6 15l2 0" />
                                </svg>
                                <span>{{ course.title || "UNTITLED" }}</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </section>
        </div>

        <section class="EXPORT_JOB border seperate">
            <div>
                <h1>Selected For Export</h1>
                <ul v-if="folders" class="selector">
                    <li v-for="course of selectedCourses" :key="course.id" @click="removeCourse(course.id)" class="selectors remove">
                        <div>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="icon icon-tabler icon-tabler-certificate"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="#000000"
                                fill="none"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M15 15m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                                <path d="M13 17.5v4.5l2 -1.5l2 1.5v-4.5" />
                                <path d="M10 19h-5a2 2 0 0 1 -2 -2v-10c0 -1.1 .9 -2 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -1 1.73" />
                                <path d="M6 9l12 0" />
                                <path d="M6 12l3 0" />
                                <path d="M6 15l2 0" />
                            </svg>
                            <span>{{ course.title || "UNTITLED" }}</span>
                        </div>
                    </li>
                </ul>
            </div>
            <button :class="`${selectedCourses.length === 0 ? 'disabled' : ''}`" @click="toggleModal(true)">Start Export</button>
        </section>

        <div class="modal-container" v-if="modalStatus">
            
            <div class="modal confirm_export"> 
                <div>
                    <h2>Please confirm</h2>
                    <span>Are you sure you wish to export the following courses?</span>
                    <pre>{{ selectedCourses.map((s) => `- ${s.title}\n`).join('') }}</pre>
                </div>
                <div class="button-group">
                    <button  @click="toggleModal(false)">Cancel</button>
                    <button @click="confirmExportJob()" class="success">Confirm</button>
                </div>
            </div>

        </div>
    </main>
</template>

<style scoped>
main {
    position: relative;
    display: grid;
    grid-template-columns: 800px 400px;
    grid-template-rows: 1fr;
    grid-column-gap: 8px;
    grid-row-gap: 0px;
}

.selection_screen {
    padding: 8px;
    display: grid;
    grid-template-columns: 300px 474px;
    grid-template-rows: 1fr;
    grid-column-gap: 8px;
}

h1 {
    margin: 0;
    padding: 0;
    margin-left: 4px;
}

.border {
    border-radius: 4px;
    border: 1px solid rgb(116, 116, 116);
}

.seperate {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

ul.selector {
    margin: 0;
    padding: 0; 
}

li.selectors {
    list-style: none;
    font-size: smaller;
}

li.selectors.active {
    color: white;
    background: rgb(22, 22, 22);
}

li.selectors:hover {
    background: rgb(92, 92, 92);
    color: white;
    cursor: pointer;
}

li.selectors.remove:hover {
    background: rgb(131, 0, 0);
    color: white;
    cursor: pointer;
}

li.selectors:hover svg,
li.selectors.active svg {
    stroke: white;
}

li.selectors {
    padding: 4px;
}

li.selectors div {
    display: flex;
    flex-direction: row;
    align-content: center;
}

li.selectors div span {
    margin-left: 4px;
}

.modal-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal {
    width: 500px;
    border-radius: 4px;
    border: 1px solid rgb(116, 116, 116);
    background: white;
    padding: 8px;
    text-align: center;
}

.modal h2 {
    margin: 0;
    padding: 0;
}

.modal pre {
    border-radius: 4px;
    background: rgb(167, 167, 167);
    padding: 8px;
    text-align: left;
    white-space:pre-wrap; 
    word-wrap:break-word;
}
    

.button-group {
    display: flex;
    justify-content: space-between
}
</style>
