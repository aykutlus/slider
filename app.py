import logging
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'

# Initialize logging
logging.basicConfig(level=logging.INFO)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Azure Blob Storage configuration
AZURE_STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
CONTAINER_NAME = 'photos'

# Initialize the Azure Blob Storage client
blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
container_client = blob_service_client.get_container_client(CONTAINER_NAME)

def generate_sas_url(container_name, blob_name):
    blob_sas = generate_blob_sas(
        account_name=blob_service_client.account_name,
        container_name=container_name,
        blob_name=blob_name,
        account_key=blob_service_client.credential.account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(hours=1)  # Set the expiration time as needed
    )
    sas_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container_name}/{blob_name}?{blob_sas}"
    return sas_url

def get_existing_photos():
    blob_list = container_client.list_blobs()
    photos = []
    for blob in blob_list:
        sas_url = generate_sas_url(CONTAINER_NAME, blob.name)
        logging.info(f"Generated SAS URL: {sas_url}")  # Log the SAS URL for debugging
        photos.append(sas_url)
    return photos

@app.route('/')
def index():
    photos = get_existing_photos()  # Fetch existing photos from Azure Blob Storage
    logging.info(f"Photos passed to template: {photos}")  # Log the list of photos
    return render_template('index.html', photos=photos)

@app.route('/upload')
def upload_page():
    return render_template('upload.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'photo' not in request.files:
        return 'No file part', 400
    
    file = request.files['photo']
    if file.filename == '':
        return 'No selected file', 400
    
    filename = file.filename
    blob_client = container_client.get_blob_client(filename)
    blob_client.upload_blob(file, overwrite=True)
    
    sas_url = generate_sas_url(CONTAINER_NAME, filename)
    logging.info(f"New photo uploaded: {sas_url}")  # Log the SAS URL of the new photo
    socketio.emit('new-image', {'url': sas_url})
    return jsonify({'url': sas_url}), 200

@app.route('/photos')
def get_photos():
    photos = get_existing_photos()  # Fetch existing photos from Azure Blob Storage
    return jsonify(photos)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
