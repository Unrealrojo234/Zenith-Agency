// src/lib/pocketbase.js
import PocketBase from 'pocketbase';

const pbUrl = process.env.REACT_APP_PB_URL;


const pb = new PocketBase(pbUrl);

export default pb;