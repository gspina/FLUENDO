import requests
import json
import base64
import sys

# Base URL del server Sanic
BASE_URL = "http://0.0.0.0:8000"

# Funzione per stampare le risposte in formato JSON formattato
def print_response(response):
    try:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except ValueError:
        print("Risposta non in formato JSON:")
        print(response.text)

# 1. Autenticazione Utente (/auth/login)
def test_login(email, password):
    url = f"{BASE_URL}/auth/login"
    payload = {
        "email": email,
        "password": password
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Login ---")
    response = requests.post(url, headers=headers, json=payload)
    print_response(response)
    if response.status_code == 200:
        return response.json().get("user_id")
    return None

# 2. Creazione di un Nuovo Utente (/users)
def test_create_user(email, password, user_type, group_id):
    url = f"{BASE_URL}/users"
    payload = {
        "email": email,
        "password": password,
        "user_type": user_type,
        "group_id": group_id
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Creazione Utente ---")
    response = requests.post(url, headers=headers, json=payload)
    print_response(response)
    if response.status_code == 201:
        return response.json().get("user_id")
    return None

# 3. Recupero Dettagli Utente (/users GET)
def test_get_user(user_id):
    url = f"{BASE_URL}/users"
    params = {
        "user_id": user_id
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Recupero Dettagli Utente ---")
    response = requests.get(url, headers=headers, params=params)
    print_response(response)

# 4. Reimpostazione della Password (/users/reset-password)
def test_reset_password(email, new_password):
    url = f"{BASE_URL}/users/reset-password"
    payload = {
        "email": email,
        "new_password": new_password
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Reimpostazione Password ---")
    response = requests.post(url, headers=headers, json=payload)
    print_response(response)

# 5. Reimpostazione dell'Email (/users/reset-username)
def test_reset_username(email, new_email):
    url = f"{BASE_URL}/users/reset-username"
    payload = {
        "email": email,
        "new_email": new_email
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Reimpostazione Email ---")
    response = requests.post(url, headers=headers, json=payload)
    print_response(response)

# 6. Eliminazione di un Utente (/users DELETE)
def test_delete_user(user_id):
    url = f"{BASE_URL}/users"
    params = {
        "user_id": user_id
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Eliminazione Utente ---")
    response = requests.delete(url, headers=headers, params=params)
    print_response(response)

# 7. Caricamento di un File (/files)
def test_upload_file(user_id, file_name, file_path):
    url = f"{BASE_URL}/files"
    # Leggi il contenuto del file e codificalo in base64
    try:
        with open(file_path, "rb") as f:
            file_content = base64.b64encode(f.read()).decode('utf-8')
    except FileNotFoundError:
        print(f"File non trovato: {file_path}")
        return
    payload = {
        "user_id": user_id,
        "file_name": file_name,
        "file_content": file_content
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Caricamento File ---")
    response = requests.post(url, headers=headers, json=payload)
    print_response(response)

# 8. Recupero Ambienti (/db/environments GET)
def test_get_environments(user_id, envname=None):
    url = f"{BASE_URL}/db/environments"
    params = {
        "user_id": user_id
    }
    if envname:
        params["envname"] = envname
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Recupero Ambienti ---")
    response = requests.get(url, headers=headers, params=params)
    print_response(response)

# 9. Creazione di un Ambiente (/db/environments POST)
def test_create_environment(user_id, env_name):
    url = f"{BASE_URL}/db/environments"
    payload = {
        "user_id": user_id,
        "env_name": env_name
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Creazione Ambiente ---")
    response = requests.post(url, headers=headers, json=payload)
    print_response(response)

# 10. Aggiornamento di un Ambiente (/db/environments PATCH)
def test_update_environment(environment_id, updates):
    url = f"{BASE_URL}/db/environments"
    payload = {
        "environment_id": environment_id,
        "updates": updates
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Aggiornamento Ambiente ---")
    response = requests.patch(url, headers=headers, json=payload)
    print_response(response)

# 11. Eliminazione di un Ambiente (/db/environments DELETE)
def test_delete_environment(environment_name, user_id):
    url = f"{BASE_URL}/db/environments"
    params = {
        "environment_name": environment_name,
        "user_id": user_id
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Eliminazione Ambiente ---")
    response = requests.delete(url, headers=headers, params=params)
    print_response(response)

# 12. Recupero Templates (/db/templates GET)
def test_get_templates(user_id):
    url = f"{BASE_URL}/db/templates"
    params = {
        "user_id": user_id
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Recupero Templates ---")
    response = requests.get(url, headers=headers, params=params)
    print_response(response)

# 13. Caricamento di un Template (/db/templates POST)
def test_upload_template(user_id, template_path, template_name):
    url = f"{BASE_URL}/db/templates"
    payload = {
        "user_id": user_id,
        "template_path": template_path,
        "template_name": template_name
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Caricamento Template ---")
    response = requests.post(url, headers=headers, json=payload)
    print_response(response)
    if response.status_code == 200:
        return response.json().get("templ_id")
    return None

# 14. Aggiornamento di un Template (/db/templates PATCH)
def test_update_template(environment_name, new_template_path):
    url = f"{BASE_URL}/db/templates"
    payload = {
        "environment_name": environment_name,
        "new_template_path": new_template_path
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Aggiornamento Template ---")
    response = requests.patch(url, headers=headers, json=payload)
    print_response(response)

# 15. Eliminazione di un Template (/db/templates DELETE)
def test_delete_template(template_name, user_id):
    url = f"{BASE_URL}/db/templates"
    params = {
        "template_name": template_name,
        "user_id": user_id
    }
    headers = {
        "Content-Type": "application/json"
    }
    print("\n--- Test Eliminazione Template ---")
    response = requests.delete(url, headers=headers, params=params)
    print_response(response)

# 16. Esempi Completi di Sequenza di Operazioni
def test_sequence():
    print("### Inizio della Sequenza di Test ###")

    # a. Creare un Nuovo Utente
    new_user_email = "test.user@example.com"
    new_user_password = "TestPass123"
    user_type = 1
    group_id = 1  # Assicurati che questo group_id esista nella tabella UsersGroup
    user_id = test_create_user(new_user_email, new_user_password, user_type, group_id)
    if not user_id:
        print("Errore nella creazione dell'utente. Interruzione della sequenza di test.")
        return
    '''
    # b. Autenticarsi come l'Utente Creato
    authenticated_user_id = test_login(new_user_email, new_user_password)
    if not authenticated_user_id:
        print("Errore nell'autenticazione dell'utente. Interruzione della sequenza di test.")
        return

    # c. Creare un Nuovo Ambiente per l'Utente
    env_name = "test_env"
    test_create_environment(authenticated_user_id, env_name)

    # d. Recuperare gli Ambienti dell'Utente
    test_get_environments(authenticated_user_id)

    # e. Caricare un Template per l'Utente
    template_path = "server-folder/templates/template_test.tpl"
    template_name = "TemplateTest"
    templ_id = test_upload_template(authenticated_user_id, template_path, template_name)
    if not templ_id:
        print("Errore nel caricamento del template.")

    # f. Recuperare i Templates dell'Utente
    test_get_templates(authenticated_user_id)

    # g. Reimpostare la Password dell'Utente
    new_password = "NewPass456"
    test_reset_password(new_user_email, new_password)

    # h. Reimpostare l'Email dell'Utente
    new_email = "test.user.reset@example.com"
    test_reset_username(new_user_email, new_email)

    # i. Autenticarsi con la Nuova Email e Password
    authenticated_user_id = test_login(new_email, new_password)
    if not authenticated_user_id:
        print("Errore nell'autenticazione con la nuova email e password.")

    # j. Caricamento di un File per l'Utente
    file_name = "documento.txt"
    file_path = "path/al/tuo/documento.txt"  # Sostituisci con un percorso valido
    test_upload_file(authenticated_user_id, file_name, file_path)

    # k. Aggiornamento di un Ambiente
    environment_id = 1  # Sostituisci con un Env_ID valido
    updates = {
        "EnvironmentName": "test_env_updated",
        "Path_to_Env": "server-folder/environments/test_env_updated"
    }
    test_update_environment(environment_id, updates)

    # l. Eliminazione di un Ambiente
    environment_name = "test_env"
    test_delete_environment(environment_name, authenticated_user_id)

    # m. Eliminazione di un Template
    test_delete_template(template_name, authenticated_user_id)

    # n. Eliminazione dell'Utente
    test_delete_user(authenticated_user_id)
    '''
    print("### Fine della Sequenza di Test ###")

if __name__ == "__main__":
    test_sequence()
