const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:\\Projects\\n-s\\.agents\\skills\\backend-api-expert\\references\\openapi.json'));
console.log(JSON.stringify(data.components.schemas.VacancySearchFiltersDTO, null, 2));
