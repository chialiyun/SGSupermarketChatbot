const fetch = require('node-fetch');
const cheerio = require('cheerio');

const PRODUCT_NAME = "name";
const PRODUCT_IMAGE_URL = "image_url";
const PRODUCT_URL = "url";
const PRODUCT_ORIGINAL_PRICE = "original_price";
const PRODUCT_DISCOUNTED_PRICE = "discounted_price";
const PRODUCT_ADDITIONAL_PROMO = "additional_promo";
const PRODUCT_PROMO_EXPIRY = "expiry";
const PRODUCT_STORE = "store";

// Websites
const fairpriceSearchURL = "https://www.fairprice.com.sg/searchterm/";
const coldStorageSearchURL = "https://coldstorage.com.sg/search?q=";
const coldStorageURL = "https://coldstorage.com.sg";
const shengSiongSearchURL = "https://allforyou.sg/search?q=";
const giantSearchURL = "https://giantonline.com.sg/search?q=";
const giantProductURL = "https://giantonline.com.sg/product";
const giantURL = "https://giantonline.com.sg";

async function getPromo() {
    const url = "https://khubite.000webhostapp.com/app/sg_supermarket/data_v1.json";

    const response = await fetch(url, { method: 'get' });
    const jsonData = await response.json();

    if (jsonData && jsonData.length > 0) {
        // console.log("json " + jsonData)
        return jsonData;
    } else {
        return "Error";
    }
};


async function getNTUCProduct(name) {
    const productList = [];
    const url = fairpriceSearchURL + name;

    const response = await fetch(url, { method: 'get' });
    const htmlData = await response.text();

    const $ = cheerio.load(htmlData);

    const productsData = $('.product');
    for (let i = 0; i < productsData.length; i += 1) {
        const productData = $(productsData[i]);

        const product = {};

        const productName = productData.find('.pdt_img div a').attr('title');
        product[PRODUCT_NAME] = productName;

        const offer = productData.find('.offer').text().trim();

        const productURL = productData.find('.pdt_name a').attr('href');
        const productImgURL = productData.find('.pdt_img img').attr('src');
        product[PRODUCT_URL] = productURL;
        product[PRODUCT_IMAGE_URL] = productImgURL;

        // If there is offer
        var isCustomOfferDate = false;
        if (offer !== "") {
            const specialOffer = productData.find('.pdt_promo a').text();
            // console.log(i + ":" + productName + "\t\t" + offer + "--" + specialOffer + "-" + data.find('.pdt_price .pdt_C_price').text().trim())

            product[PRODUCT_ADDITIONAL_PROMO] = specialOffer;
            const currentPrice = productData.find('.pdt_price .pdt_C_price').text().trim()
            product[PRODUCT_DISCOUNTED_PRICE] = currentPrice;

            // But no special offer, so get the discount price
            if (specialOffer === "") {
                isCustomOfferDate = true;
                const originalPrice = productData.find('.pdt_price .pdt_O_price').text().trim()
                product[PRODUCT_ORIGINAL_PRICE] = originalPrice;
            } else {
                product[PRODUCT_ORIGINAL_PRICE] = "";
            }

            if (offer == "PWP")
                isCustomOfferDate = false;

            // Get expiry date
            const expiry = await getNTUCExpiry(productURL, isCustomOfferDate)

            product[PRODUCT_PROMO_EXPIRY] = expiry;

            productList.push(product);
        }
    }

    return productList;
}

async function getColdStorageProduct(name) {
    const productList = [];
    const url = coldStorageSearchURL + name;

    const response = await fetch(url, { method: 'get' });
    const htmlData = await response.text();

    const $ = cheerio.load(htmlData);

    const productsData = $('.items li');
    for (let i = 0; i < productsData.length; i += 1) {
        const productData = $(productsData[i]);

        const product = {};

        const productName = productData.find('.product-link').text();
        product[PRODUCT_NAME] = productName;

        const offer = productData.find('.product-discount-label').text();

        const productURL = productData.find('.product-link').attr('href');
        let productImgURL = productData.find('.img img').attr('src');

        if (productImgURL.indexOf("http") < 0)
            productImgURL = coldStorageURL + productImgURL

        product[PRODUCT_URL] = coldStorageURL + productURL;
        product[PRODUCT_IMAGE_URL] = productImgURL;

        // If there is offer
        if (offer !== "") {
            product[PRODUCT_ADDITIONAL_PROMO] = offer;

            const currentPrice = productData.find('.content_price .product-price').text().trim();
            // Special Offer
            if (offer.includes("BUY")) {
                product[PRODUCT_ORIGINAL_PRICE] = currentPrice;
            } else {
                product[PRODUCT_DISCOUNTED_PRICE] = currentPrice;

                const originalPrice = productData.find('.content_info span').text().trim()
                product[PRODUCT_ORIGINAL_PRICE] = originalPrice;
            }

            product[PRODUCT_PROMO_EXPIRY] = "";

            productList.push(product);
        }
    }

    return productList;
}

async function getShengSiongProduct(name) {
    const productList = [];
    const url = shengSiongSearchURL + name;

    const response = await fetch(url, { method: 'get' });
    const htmlData = await response.text();

    const $ = cheerio.load(htmlData);

    const productsData = $('.productbox-span');
    for (let i = 0; i < productsData.length; i += 1) {
        const productData = $(productsData[i]);

        const product = {};

        const productName = productData.find('.prodname span').text().trim();
        product[PRODUCT_NAME] = productName;

        const hiddenData = productData.find('.prod-data');

        // var productImgURL = productData.find('#productImageThumb').attr('style');
        var productImgURL = hiddenData.attr('data-imgurl');
        product[PRODUCT_URL] = encodeURI(shengSiongSearchURL + productName);    //  Encode the string to URI
        product[PRODUCT_IMAGE_URL] = productImgURL;

        const hasOffer = hiddenData.attr('data-hasoffers');
        // If there is offer
        if (hasOffer === "True") {
            const offerName = hiddenData.attr('data-offername');
            product[PRODUCT_ADDITIONAL_PROMO] = offerName;
            const currentPrice = hiddenData.attr('data-price');
            product[PRODUCT_DISCOUNTED_PRICE] = currentPrice;
            const originalPrice = hiddenData.attr('data-oldprice');
            product[PRODUCT_ORIGINAL_PRICE] = originalPrice

            product[PRODUCT_PROMO_EXPIRY] = "";

            productList.push(product);
        }
    }
    return productList;
}

async function getGiantProduct(name) {
    const productList = [];
    const url = giantSearchURL + name;

    const response = await fetch(url, { method: 'get' });
    const htmlData = await response.text();

    const $ = cheerio.load(htmlData);

    const productsData = $('.items li');
    for (let i = 0; i < productsData.length; i += 1) {
        const productData = $(productsData[i]);

        const product = {};

        const productName = productData.find('.product-name a').text();
        product[PRODUCT_NAME] = productName;

        const offer = productData.find('.product-discount-label').text();

        const productURL = productData.attr('data-url');
        let productImgURL = productData.find('.img img').attr('src');

        if (productImgURL.indexOf("http") < 0)
            productImgURL = giantURL + productImgURL

        product[PRODUCT_URL] = giantProductURL + productURL;
        product[PRODUCT_IMAGE_URL] = productImgURL;

        // If there is offer
        if (offer !== "") {
            product[PRODUCT_ADDITIONAL_PROMO] = offer;

            const currentPrice = productData.find('.content_price .product-price').text().trim();
            // Special Offer
            if (offer.includes("BUY")) {
                product[PRODUCT_ORIGINAL_PRICE] = currentPrice;
            } else {
                product[PRODUCT_DISCOUNTED_PRICE] = currentPrice;

                const originalPrice = productData.find('.content_info span').text();
                product[PRODUCT_ORIGINAL_PRICE] = originalPrice;
            }

            product[PRODUCT_PROMO_EXPIRY] = "";

            productList.push(product);
        }
    }

    return productList;
}

// async function getNTUCProduct(name, res) {
//     const productList = [];
//     const url = fairpriceSearchURL + name;

//     const response = await fetch(url, { method: 'get' });
//     const htmlData = response.text();

//     const $ = cheerio.load(body);


//     return await fetch(url, {
//         method: 'get'
//     })
//         .then(res => res.text())
//         .then(async (body) => {
//             const $ = cheerio.load(body);
//             // Get each product
//             await $('.product').each(async function (i, elem) {
//                 var data = $(this);

//                 var product = {};

//                 var productName = data.find('.pdt_img div a').attr('title');
//                 product[PRODUCT_NAME] = productName;

//                 //https://stackoverflow.com/questions/154059/how-do-you-check-for-an-empty-string-in-javascript
//                 var offer = data.find('.offer').text().trim();

//                 var productURL = data.find('.pdt_name a').attr('href');
//                 var productImgURL = data.find('.pdt_img img').attr('src');
//                 product[PRODUCT_URL] = productURL;
//                 product[PRODUCT_IMAGE_URL] = productImgURL;

//                 // If there is offer
//                 if (offer !== "") {
//                     var specialOffer = data.find('.pdt_promo a').text();
//                     // console.log(i + ":" + productName + "\t\t" + offer + "--" + specialOffer + "-" + data.find('.pdt_price .pdt_C_price').text().trim())

//                     product[PRODUCT_ADDITIONAL_PROMO] = specialOffer;

//                     // But no special offer, so get the discount price
//                     if (specialOffer === "") {
//                         var currentPrice = data.find('.pdt_price .pdt_C_price').text().trim()
//                         var originalPrice = data.find('.pdt_price .pdt_O_price').text().trim()
//                         console.log(i + ":" + productName + "\t\t" + offer + "--" + specialOffer + "-" + currentPrice + "---" + originalPrice)
//                         product[PRODUCT_ORIGINAL_PRICE] = originalPrice;
//                         product[PRODUCT_DISCOUNTED_PRICE] = currentPrice;
//                     }

//                     // Get expiry date
//                     var expiry = await getNTUCExpiry(productURL)

//                     product[PRODUCT_PROMO_EXPIRY] = expiry;

//                     console.log(product)

//                     productList.push(product);
//                 }

//             })

//             console.log(productList)
//             return await productList;
//         })
// };


async function getNTUCExpiry(url, isCustomOfferDate) {
    return await fetch(url, {
        method: 'get'
    })
        .then(res => res.text())
        .then(async body => {
            const $ = cheerio.load(body);
            if (isCustomOfferDate)
                var offerDate = $('.custom_offerDate div').text().trim().replace("Till", "");
            else
                var offerDate = $('.ofr_text').text().trim().replace("Till", "");

            return offerDate;
        })
}

module.exports.getPromo = getPromo;
module.exports.getNTUCProduct = getNTUCProduct;
module.exports.getColdStorageProduct = getColdStorageProduct;
module.exports.getShengSiongProduct = getShengSiongProduct;
module.exports.getGiantProduct = getGiantProduct;
module.exports.resultKey = {
    PRODUCT_ADDITIONAL_PROMO,
    PRODUCT_DISCOUNTED_PRICE,
    PRODUCT_IMAGE_URL,
    PRODUCT_NAME,
    PRODUCT_ORIGINAL_PRICE,
    PRODUCT_PROMO_EXPIRY,
    PRODUCT_STORE,
    PRODUCT_URL
}

// getPromo("https://khubite.000webhostapp.com/app/sg_supermarket/data_v2.json").then(data => {
//     console.log(data);
// });