import http from 'http';
import fs from 'fs/promises';
import cats from './cats.js';
import { readCats, addCat, getCatById, editCat, deleteCat} from './catService.js';
import { addBreed, getBreedById, readBreeds } from './breedService.js';

const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/cats/add-cat') {
        const bodyFormData = await readBodyFormData(req);

       const newCat = {
            name: bodyFormData.get('name'),
            description: bodyFormData.get('description'),
            image: bodyFormData.get('image'),
            breed: bodyFormData.get('breed')
        };

        addCat(newCat);

        return res.writeHead(302, { Location: '/' }).end();
    }

    if (req.method === 'POST' && req.url === '/cats/add-breed') {
        const bodyFormData = await readBodyFormData(req);

        const breedName = bodyFormData.get('breed');

        addBreed(breedName);

        return res.writeHead(302, { Location: '/' }).end();
    }

    if(req.url === '/styles/site.css')
    {
        const cssContent = await fs.readFile('./src/styles/site.css', 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/css'});
        res.write(cssContent);
        return res.end();
    }

      if (req.method === 'POST' && req.url.startsWith('/cats/edit-cat')) {
        const catId = req.url.split('/').pop();
        const editedCat = await readBodyFormData(req);

        editCat(catId, {
            name: editedCat.get('name'),
            description: editedCat.get('description'),
            image: editedCat.get('image'),
            breed: editedCat.get('breed')
        });

        return res.writeHead(302, { Location: '/' }).end();
    }

    if(req.method === 'POST' && req.url.startsWith('/cats/new-home'))
    {
        const catId = req.url.split('/').pop();

        if(!deleteCat(catId))
        {
            return renderNotFoundPage();
        }

        return res.writeHead(302, { Location: '/'}).end();
    }

    let htmlContent = '';

    if (req.url === '/') {
        htmlContent = await renderHomePage();
    } else if(req.url.startsWith('/search')){
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const name = urlParams.get('name');
        htmlContent = await renderHomePage(name);
    }else if (req.url === '/cats/add-breed') {
        htmlContent = await fs.readFile('./src/views/addBreed.html', 'utf-8');
    } else if (req.url === '/cats/add-cat') {
        htmlContent = await renderAddCatPage();
    } else if(req.url.startsWith('/cats/edit-cat')){
        const catId = req.url.split('/').pop();
        htmlContent = await renderEditCatPage(catId);
    } else if(req.url.startsWith('/cats/new-home')) {
        const catId = req.url.split('/').pop();
        htmlContent = await renderNewHomePage(catId);
    } else {
        htmlContent = await renderNotFoundPage();
    }

    res.writeHead(200, { 'Content-Type': 'text/html '});
    res.write(htmlContent);

    res.end();
});

server.listen(5000);

console.log('Server is listening on http://localhost:5000...');

async function renderHomePage(name)
{
    const htmlContent = await fs.readFile('./src/views/home/index.html', 'utf-8');

    const catTemplate = (cat) => `
            <li>
                <img src="${cat.image}" alt="${cat.name}">
                <h3>${cat.name}</h3>
                <p><span>Breed: </span>${cat.breed?.name || cat.breed || 'Unknown'}</p>
                <p><span>Description: </span>${cat.description}</p>
                <ul class="buttons">
                    <li class="btn edit"><a href="/cats/edit-cat/${cat.id}">Change Info</a></li>
                    <li class="btn delete"><a href="/cats/new-home/${cat.id}">New Home</a></li>
                </ul>
            </li>`;

    const catsContent = name ? 
        `<ul>${readCats().filter((cat) => cat.name === name).map(cat => catTemplate(cat)).join('\n')}</ul>` :
        `<ul>${readCats().map(cat => catTemplate(cat)).join('\n')}</ul>`

    const result = htmlContent.replace('{{cats}}', catsContent)
                              .replace('{{query}}', name ? name : '');

    return result;
}

async function renderAddCatPage()
{
    const htmlContent =  await fs.readFile('./src/views/addCat.html', 'utf-8');

    const breedOptions = readBreeds().map(breed => `<option value = "${breed.id}">${breed.name}</option>`).join('\n');
    const result = htmlContent.replace('{{breedOptions}}', breedOptions);

    return result;
}

function renderBreedOptions(currentBreed)
{
    const currentBreedId = currentBreed?.id || currentBreed;

    return readBreeds()
        .map(breed => `<option value="${breed.id}" ${breed.id === currentBreedId ? 'selected' : ''}>${breed.name}</option>`)
        .join('\n');
}

async function renderEditCatPage(catId) {
    const cat = getCatById(catId);

    if (!cat) {
        return renderNotFoundPage();
    }

    const htmlContent = await fs.readFile('./src/views/editCat.html', 'utf-8');
    const result = htmlContent.replace('{{name}}', cat.name)
        .replace('{{description}}', cat.description)
        .replace('{{image}}', cat.image)
        .replace('{{breadOptions}}', renderBreedOptions(cat.breed));

    return result;
}

async function renderNewHomePage(catId)
{
    const cat = getCatById(catId);
    if(!cat)
    {
        return renderNotFoundPage();
    }

    const htmlContent = await fs.readFile('./src/views/catShelter.html', 'utf-8');

    const result = htmlContent.replaceAll('{{name}}', cat.name)
        .replace('{{image}}', cat.image)
        .replace('{{description}}', cat.description)
        .replace('{{breedOptions}}', renderBreedOptions(cat.breed));

    return result;
}

function renderNotFoundPage()
{
    return fs.readFile('./src/views/notFound.html');
}

function readBodyFormData(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', () => {
            const formData = new URLSearchParams(body);

            resolve(formData);
        });
    });
}