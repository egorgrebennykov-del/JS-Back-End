import { randomUUID } from 'crypto';
import cats from './cats.js';
import { getBreedById } from './breedService.js';

export function readCats()
{
    return cats;
}

export function addCat(catData)
{
    const newCat = {
        id: randomUUID(),
        ...catData,
        breed: getBreedById(catData.breed)
    };
    cats.push(newCat);
}

export function getCatById(catId) {
    return cats.find(cat => cat.id === catId);
}

export function editCat(catId, catData) {
    const catIndex = cats.findIndex(cat => cat.id === catId);

    cats[catIndex] = {
        id: catId,
        ...catData,
        breed: getBreedById(catData.breed) || 'Unknown Breed',
    };
}

export function deleteCat(catId)
{
    const catIndex = cats.findIndex(cat => cat.id === catId);

    if(catIndex === -1)
    {
        return false;
    }

    cats.splice(catIndex, 1);
    return true;
}