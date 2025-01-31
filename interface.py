import requests

class Fluendo_API:
    BASE_URL = ""

    def __init__(self):
        self.session = requests.Session()

    def upload_file(self, file_data):
        url = f"{self.BASE_URL}/files"
        response = self.session.post(url, json=file_data)
        return response.json()

    def login(self, username, password):
        url = f"{self.BASE_URL}/auth/login"
        data = {
            "username": username,
            "password": password
        }
        response = self.session.post(url, json=data)
        return response.json()

    def get_db_environments(self, username):
        url = f"{self.BASE_URL}/db/environments"
        params = {"username": username}
        response = self.session.get(url, params=params)
        return response.json()

    def upload_db_environment(self, username):
        url = f"{self.BASE_URL}/db/environments"
        data = {"username": username}
        response = self.session.post(url, json=data)
        return response.json()

    def update_db_environment(self, environment_id, updates):
        url = f"{self.BASE_URL}/db/environments"
        data = {
            "environment_id": environment_id,
            "updates": updates
        }
        response = self.session.patch(url, json=data)
        return response.json()

    def delete_db_environment(self, environment_name):
        url = f"{self.BASE_URL}/db/environments"
        params = {"environment_name": environment_name}
        response = self.session.delete(url, params=params)
        return response.json()

    def get_db_templates(self, username):
        url = f"{self.BASE_URL}/db/templates"
        params = {"username": username}
        response = self.session.get(url, params=params)
        return response.json()

    def upload_db_template(self, username):
        url = f"{self.BASE_URL}/db/templates"
        data = {"username": username}
        response = self.session.post(url, json=data)
        return response.json()

    def delete_db_template(self, template_name):
        url = f"{self.BASE_URL}/db/templates"
        params = {"template_name": template_name}
        response = self.session.delete(url, params=params)
        return response.json()

    def upgrade_db_template(self, environment_name):
        url = f"{self.BASE_URL}/db/templates"
        data = {"environment_name": environment_name}
        response = self.session.patch(url, json=data)
        return response.json()

    def get_users(self, username):
        url = f"{self.BASE_URL}/users"
        params = {"username": username}
        response = self.session.get(url, params=params)
        return response.json()

    def create_user(self, username, email, password):
        url = f"{self.BASE_URL}/users"
        data = {
            "username": username,
            "email": email,
            "password": password
        }
        response = self.session.post(url, json=data)
        return response.json()

    def delete_user(self, user_id):
        url = f"{self.BASE_URL}/users"
        params = {"user_id": user_id}
        response = self.session.delete(url, params=params)
        return response.json()

    def reset_password(self, username):
        url = f"{self.BASE_URL}/users/reset-password"
        data = {"username": username}
        response = self.session.post(url, json=data)
        return response.json()

    def reset_username(self, email):
        url = f"{self.BASE_URL}/users/reset-username"
        data = {"email": email}
        response = self.session.post(url, json=data)
        return response.json()

# Example usage
if __name__ == "__main__":
    api_client = Fluendo_API()
    response = api_client.login("user1", "password123")
    print(response)
