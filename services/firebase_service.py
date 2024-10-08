import firebase_admin
from firebase_admin import credentials, firestore

# Inicializa o Firebase
cred = credentials.Certificate('../../firebaseKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

def save_to_firebase(produtos):
    batch = db.batch()

    for produto in produtos:
        doc_ref = db.collection('produtos').document()
        batch.set(doc_ref, produto)

    batch.commit()
    print("Produtos salvos no Firestore com sucesso")
