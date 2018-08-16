const http = require('http');
const axious = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const util = require('util');
const path = require('path');


const writeFile = util.promisify(fs.writeFile);


const getImageUrlsFromResponse = (res) => {
    const $ = cheerio.load(res.data);
    const preview_html = $('#content > div:nth-child(1) > table:nth-child(5) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > input:nth-child(7)').val()
    const $$ = cheerio.load(preview_html);
    const url = $$('img').attr('src');
    return url;
}

async function getPageUrls() {
    const a =
        await axious.get('http://superstarfloraluk.com/8522767-NASA-Galaxy-Pictures-High-Resolution.html');

    const $ = cheerio.load(a.data);
    const image_count = $('.masonry-item .image-wrap img').length + 1;
    const fileName = n => 'nasa-galaxy-pictures-high-resolution-' + n + '.html';
    const urlOf = i => 'http://superstarfloraluk.com/view/' + fileName(i + 1);
    const pageUrls = Array(image_count).fill().map((value, i) => urlOf(i));
    return pageUrls;
}

async function getImageUrls(pageUrls) {
    const allPromises = pageUrls.map(url => axious.get(url));
    const pages = await Promise.all(allPromises);
    const imageUrls = pages.map(getImageUrlsFromResponse);
    return imageUrls;
}

async function downloadImages(imageUrls) {
    imageUrls.forEach(async (imageUrl, i) => {
        const res = await axious.request({
            responseType: 'arraybuffer',
            url: imageUrl,
            method: 'get',
            headers: {
                'Content-Type': 'image/jpeg'
            }
        });
        const filePath = path.join(__dirname, 'images', '' + i + '.jpg');
        const a = await writeFile(filePath, res.data);
        return a;
    })
};

async function main() {
    try {
        const pageUrls = await getPageUrls();
        const pics = await getImageUrls(pageUrls);
        downloadImages(pics);

    } catch (ex) {
        console.log(ex);
    }
}

main();