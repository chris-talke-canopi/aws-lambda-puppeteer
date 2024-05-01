import * as _ from 'lodash'

const ENDPOINTS = { 
    courses : 'https://i4nsjamm6qyrlm73fjtcqctwue0zrwge.lambda-url.ap-southeast-2.on.aws',
    triggerBatchJob: 'https://4y44oacqbah7pwnosw2voqylbm0nwthd.lambda-url.ap-southeast-2.on.aws'
};

const api = {
    getCourses : async function(cache = false) {
        if (cache) { 
           const courses_str = window.localStorage.getItem('COURSES');
           if (courses_str) {
                
                const folders = _.sortBy(JSON.parse(courses_str), 'name');
                for (let i = 0; i < folders.length; i++) {
                    const folder = folders[i];
                    const items = [];
                    
                    for (const key in folder.items) {
                        if (Object.hasOwnProperty.call(folder.items, key)) {
                            const course = folder.items[key];
                            items.push(course);
                        }
                    }

                    folder.items = _.sortBy(items, 'title');
                }

                return folders;
           }
        }

        const response = await fetch(ENDPOINTS.courses).then(r => r.json()).catch((e) => console.error(e))
        if (response.status === 200) {

            const folders = _.sortBy(response.message, 'name');
            for (let i = 0; i < folders.length; i++) {
                const folder = folders[i];
                const items = [];
                
                for (const key in folder.items) {
                    if (Object.hasOwnProperty.call(folder.items, key)) {
                        const course = folder.items[key];
                        items.push(course);
                    }
                }

                folder.items = _.sortBy(items, 'title');
            }

            window.localStorage.setItem('COURSES', JSON.stringify(folders))
            return folders;
        }; 

        return [];
    },
    sendBatchJob: async function (payload) {

        const response = await fetch(ENDPOINTS.triggerBatchJob, {
            method: "POST",
            body: JSON.stringify(payload),
        }).then(r => r.json()).catch((e) => console.error(e))

        if (response.status === 200) return true;
        
        return false;
    }
};

export {
    api
}