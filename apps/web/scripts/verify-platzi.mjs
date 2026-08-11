import axios from 'axios';

const base = 'https://api.escuelajs.co/api/v1';

const products = await axios.get(`${base}/products`, { params: { limit: 4, offset: 0 } });
const categories = await axios.get(`${base}/categories`);
const firstId = products.data[0]?.id;
const detail = firstId ? await axios.get(`${base}/products/${firstId}`) : null;
const related = firstId ? await axios.get(`${base}/products/${firstId}/related`) : { data: [] };
const search = await axios.get(`${base}/products`, { params: { title: 'Classic', limit: 3 } });

console.log(
  JSON.stringify(
    {
      ok: true,
      productSample: products.data.length,
      categories: categories.data.length,
      detail: detail?.data?.title ?? null,
      related: related.data.length,
      search: search.data.length,
    },
    null,
    2,
  ),
);
