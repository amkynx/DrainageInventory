import json
import mysql.connector
from datetime import datetime

# Load the GeoJSON file
with open('data/Mukim Bandar Maharani.geojson', 'r') as file:
    geojson_data = json.load(file)

# Connect to the MySQL database
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",  # Replace with your MySQL password
    database="DrainageInventory"
)
cursor = db.cursor()

# Insert data into the database
for feature in geojson_data['features']:
    properties = feature['properties']
    geometry = feature['geometry']

    # Ensure the geometry type is Point
    if geometry['type'] != 'Point':
        continue

    # Combine 'name2' and 'Location' into the 'name' column
    name_part1 = properties.get('Name') or "Unknown"
    name_part2 = properties.get('Location') or "Unknown"
    name = f"{name_part1} - {name_part2}"  # Combine with a separator (e.g., " - ")

    # Map other GeoJSON properties to database columns
    type_ = properties.get('Type') or "Unknown"  # Default to 'Unknown' if not provided
    status = "Unknown"  # Default status since it's not in the GeoJSON

    # Handle depth conversion safely
    depth_value = properties.get('Depth__m_')
    try:
        depth = float(depth_value) if depth_value and depth_value != '-' else 0.0  # Default to 0.0 if missing or invalid
    except ValueError:
        depth = 0.0  # Default to 0.0 if conversion fails

    invert_level = properties.get('IL') or None
    reduced_level = properties.get('RL') or None
    description = properties.get('Remarks') or None
    last_inspection = None  # Assuming no inspection data in the GeoJSON
    
    # Handle media links - convert to JSON string if present
    media_links = properties.get('gx_media_links')
    images = json.dumps(media_links) if media_links else None
    
    # Use current date as last_updated if not available
    last_updated = datetime.now().strftime('%Y-%m-%d')

    # Extract coordinates
    coordinates = geometry['coordinates']
    if len(coordinates) >= 2:
        longitude, latitude = coordinates[:2]
    else:
        longitude, latitude = None, None

    # Insert into the database
    sql = """
        INSERT INTO drainage_points (
            name, `type`, status, depth, invert_level, reduced_level, latitude, longitude, description, last_inspection, images, last_updated
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """
    
    try:
        cursor.execute(sql, (name, type_, status, depth, invert_level, reduced_level, latitude, longitude, description, last_inspection, images, last_updated))
        print(f"Successfully inserted point: {name}")
    except mysql.connector.Error as err:
        print(f"Error inserting point {name}: {err}")
        # Uncomment below to see the actual data being inserted for debugging
        # print(f"Data: {(name, type_, status, depth, invert_level, reduced_level, latitude, longitude, description, last_inspection, images, last_updated)}")

# Commit the transaction
db.commit()
print(f"Total points inserted: {cursor.rowcount}")

# Close the connection
cursor.close()
db.close()