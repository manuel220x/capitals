// Script to convert GeoJSON data to SVG paths for Mexico states map
const fs = require('fs');
const path = require('path');

// Function to convert longitude/latitude to SVG coordinates
function projectCoordinates(coords, bounds) {
    const [lon, lat] = coords;
    
    // Project to SVG coordinates (simple equirectangular projection)
    const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 900;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 600;
    
    return [x, y];
}

// Function to convert polygon coordinates to SVG path
function polygonToSVGPath(coordinates, bounds) {
    if (!coordinates || coordinates.length === 0) return '';
    
    let path = '';
    
    // Handle multiple polygons (some states might have islands)
    coordinates.forEach((ring, ringIndex) => {
        if (ring.length === 0) return;
        
        // Start path
        const [startX, startY] = projectCoordinates(ring[0], bounds);
        path += `M ${startX.toFixed(2)} ${startY.toFixed(2)}`;
        
        // Add lines to other points
        for (let i = 1; i < ring.length; i++) {
            const [x, y] = projectCoordinates(ring[i], bounds);
            path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
        }
        
        // Close path
        path += ' Z';
        
        // Add space between rings
        if (ringIndex < coordinates.length - 1) {
            path += ' ';
        }
    });
    
    return path;
}

// Function to calculate bounds for all Mexico
function calculateBounds(allCoordinates) {
    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    
    allCoordinates.forEach(stateCoords => {
        stateCoords.forEach(ring => {
            ring.forEach(([lon, lat]) => {
                minLon = Math.min(minLon, lon);
                maxLon = Math.max(maxLon, lon);
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
            });
        });
    });
    
    return { minLon, maxLon, minLat, maxLat };
}

// Main function to process all states
async function processStates() {
    const statesDir = path.join(__dirname, 'geosonmexico', 'states');
    const files = fs.readdirSync(statesDir).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${files.length} state files`);
    
    const statesData = [];
    const allCoordinates = [];
    
    // Read all state files
    for (const file of files) {
        const filePath = path.join(statesDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (data.features && data.features.length > 0) {
            const stateName = data.name;
            const geometry = data.features[0].geometry;
            
            if (geometry && geometry.type === 'Polygon') {
                const coordinates = geometry.coordinates;
                statesData.push({ name: stateName, coordinates });
                allCoordinates.push(coordinates);
                console.log(`Processed: ${stateName}`);
            }
        }
    }
    
    // Calculate bounds for all of Mexico
    const bounds = calculateBounds(allCoordinates);
    console.log('Mexico bounds:', bounds);
    
    // Convert to SVG paths
    const statesPaths = {};
    
    statesData.forEach(({ name, coordinates }) => {
        const svgPath = polygonToSVGPath(coordinates, bounds);
        statesPaths[name] = svgPath;
        console.log(`Generated SVG path for: ${name}`);
    });
    
    // Generate the updated mexicanStates.js file content
    const jsContent = `// Mexican States data with accurate geographical boundaries
// Generated from GeoJSON data

const mexicanStates = {
    "Aguascalientes": {
        "capital": "Aguascalientes",
        "demonym": "Aguascalentense",
        "acceptedDemonyms": ["Aguascalentense", "Hidrocálido"]
    },
    "Baja California": {
        "capital": "Mexicali",
        "demonym": "Bajacaliforniano",
        "acceptedDemonyms": ["Bajacaliforniano"]
    },
    "Baja California Sur": {
        "capital": "La Paz",
        "demonym": "Sudcaliforniano",
        "acceptedDemonyms": ["Sudcaliforniano"]
    },
    "Campeche": {
        "capital": "Campeche",
        "demonym": "Campechano",
        "acceptedDemonyms": ["Campechano"]
    },
    "Chiapas": {
        "capital": "Tuxtla Gutiérrez",
        "demonym": "Chiapaneco",
        "acceptedDemonyms": ["Chiapaneco"]
    },
    "Chihuahua": {
        "capital": "Chihuahua",
        "demonym": "Chihuahuense",
        "acceptedDemonyms": ["Chihuahuense"]
    },
    "Ciudad de México": {
        "capital": "Ciudad de México",
        "demonym": "Chilango",
        "acceptedDemonyms": ["Chilango", "Capitalino", "Defeño"]
    },
    "Coahuila de Zaragoza": {
        "capital": "Saltillo",
        "demonym": "Coahuilense",
        "acceptedDemonyms": ["Coahuilense"]
    },
    "Colima": {
        "capital": "Colima",
        "demonym": "Colimense",
        "acceptedDemonyms": ["Colimense"]
    },
    "Durango": {
        "capital": "Durango",
        "demonym": "Duranguense",
        "acceptedDemonyms": ["Duranguense"]
    },
    "Guanajuato": {
        "capital": "Guanajuato",
        "demonym": "Guanajuatense",
        "acceptedDemonyms": ["Guanajuatense", "Bajío"]
    },
    "Guerrero": {
        "capital": "Chilpancingo",
        "demonym": "Guerrerense",
        "acceptedDemonyms": ["Guerrerense"]
    },
    "Hidalgo": {
        "capital": "Pachuca",
        "demonym": "Hidalguense",
        "acceptedDemonyms": ["Hidalguense"]
    },
    "Jalisco": {
        "capital": "Guadalajara",
        "demonym": "Jalisciense",
        "acceptedDemonyms": ["Jalisciense", "Tapatío"]
    },
    "México": {
        "capital": "Toluca",
        "demonym": "Mexiquense",
        "acceptedDemonyms": ["Mexiquense"]
    },
    "Michoacán de Ocampo": {
        "capital": "Morelia",
        "demonym": "Michoacano",
        "acceptedDemonyms": ["Michoacano"]
    },
    "Morelos": {
        "capital": "Cuernavaca",
        "demonym": "Morelense",
        "acceptedDemonyms": ["Morelense"]
    },
    "Nayarit": {
        "capital": "Tepic",
        "demonym": "Nayarita",
        "acceptedDemonyms": ["Nayarita"]
    },
    "Nuevo León": {
        "capital": "Monterrey",
        "demonym": "Neoleonés",
        "acceptedDemonyms": ["Neoleonés", "Regiomontano"]
    },
    "Oaxaca": {
        "capital": "Oaxaca de Juárez",
        "demonym": "Oaxaqueño",
        "acceptedDemonyms": ["Oaxaqueño"]
    },
    "Puebla": {
        "capital": "Puebla",
        "demonym": "Poblano",
        "acceptedDemonyms": ["Poblano"]
    },
    "Querétaro": {
        "capital": "Querétaro",
        "demonym": "Queretano",
        "acceptedDemonyms": ["Queretano"]
    },
    "Quintana Roo": {
        "capital": "Chetumal",
        "demonym": "Quintanarroense",
        "acceptedDemonyms": ["Quintanarroense"]
    },
    "San Luis Potosí": {
        "capital": "San Luis Potosí",
        "demonym": "Potosino",
        "acceptedDemonyms": ["Potosino"]
    },
    "Sinaloa": {
        "capital": "Culiacán",
        "demonym": "Sinaloense",
        "acceptedDemonyms": ["Sinaloense"]
    },
    "Sonora": {
        "capital": "Hermosillo",
        "demonym": "Sonorense",
        "acceptedDemonyms": ["Sonorense"]
    },
    "Tabasco": {
        "capital": "Villahermosa",
        "demonym": "Tabasqueño",
        "acceptedDemonyms": ["Tabasqueño"]
    },
    "Tamaulipas": {
        "capital": "Ciudad Victoria",
        "demonym": "Tamaulipeco",
        "acceptedDemonyms": ["Tamaulipeco"]
    },
    "Tlaxcala": {
        "capital": "Tlaxcala",
        "demonym": "Tlaxcalteca",
        "acceptedDemonyms": ["Tlaxcalteca"]
    },
    "Veracruz de Ignacio de la Llave": {
        "capital": "Xalapa",
        "demonym": "Veracruzano",
        "acceptedDemonyms": ["Veracruzano", "Jarocho"]
    },
    "Yucatán": {
        "capital": "Mérida",
        "demonym": "Yucateco",
        "acceptedDemonyms": ["Yucateco"]
    },
    "Zacatecas": {
        "capital": "Zacatecas",
        "demonym": "Zacatecano",
        "acceptedDemonyms": ["Zacatecano"]
    }
};

// SVG paths with accurate geographical boundaries
const statesPaths = ${JSON.stringify(statesPaths, null, 4)};
`;
    
    // Write the updated file
    fs.writeFileSync('mexicanStates_updated.js', jsContent);
    console.log('Generated mexicanStates_updated.js with accurate geographical data');
    
    return statesPaths;
}

// Run the script
processStates().catch(console.error);