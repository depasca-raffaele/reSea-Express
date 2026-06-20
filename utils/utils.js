function formatProduct(product, baseUrl) {
    //Assegno alla variabile il "nome dell'immagine" e gli do un placeholder in caso di immagine inesistente 
    const imageFileName = product.image ? product.image : "placeholder.png";

    //Estraggo create_date dall'oggetto JSON per non farlo arrivare alla card. Non sono dati 
    //che interessano al cliente
    const { create_date, ...productData } = product;

    return {
        //restituisco l'altra parte dell'oggetto
        ...productData,

        //trasformo sia prezzo che plastic_offset_kg per poi poterci fare
        //operazioni in futuro aggiungendo 0 in caso che arrivi una stringa vuota
        price: parseFloat(product.price) || 0,
        plastic_offset_kg: parseFloat(product.plastic_offset_kg) || 0,

        //qui viene montato l'URL completo delle immagini, così al momento della richiesta gli viene passato tutto l'URL
        // 'http://localhost:3000/assets/nome-img.jpg'
        image: `${baseUrl}/assets/${imageFileName}`
    };
}

export { formatProduct }