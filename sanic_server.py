from sanic import Sanic, response
from sanic.request import Request
from sanic_ext import Extend
import aiomysql
import os
import hashlib
import re

app = Sanic("API_Server")
Extend(app)



DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'my_user'),
    'password': os.getenv('DB_PASSWORD', 'secure_password'),
    'db': os.getenv('DB_NAME', 'my_database'),
    'charset': 'utf8mb4',
}

# Initialize the connection pool
@app.listener('before_server_start')
async def setup_db(app, loop):
    app.ctx.db_pool = await aiomysql.create_pool(
        **DB_CONFIG,
        autocommit=True,
        cursorclass=aiomysql.DictCursor  # Use DictCursor for dict-like results
    )

@app.listener('after_server_stop')
async def close_db(app, loop):
    app.ctx.db_pool.close()
    await app.ctx.db_pool.wait_closed()

# Authentication Endpoint
@app.post("/auth/login")
async def login(request: Request):
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return response.json({"message": "Email and password are required."}, status=400)
    
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    
    query = "SELECT User_ID, User_Type FROM Users WHERE Email=%s AND Pssw=%s;"
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, (email, hashed_password))
            user = await cur.fetchone()
    
    if user:
        # Implement token generation here (e.g., JWT)
        return response.json({
            "message": "Authenticated successfully.",
            "user_id": user['User_ID'],
            "user_type": user['User_Type']
        })
    else:
        return response.json({"message": "Authentication failed."}, status=401)

# Upload File Endpoint
@app.post("/files")
async def upload_file(request: Request):
    data = request.json
    user_id = data.get("user_id")
    file_name = data.get("file_name")
    file_content = data.get("file_content")  # Handle actual file uploads appropriately
    
    if not user_id or not file_name or not file_content:
        return response.json({"message": "user_id, file_name, and file_content are required."}, status=400)
    
    file_path = f"/server-folder/uploads/{file_name}"
    
    query = "INSERT INTO Files (User_ID, File_Name, File_Path) VALUES (%s, %s, %s);"
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, (user_id, file_name, file_path))
    
    # Save the file content to the filesystem or storage service here
    
    return response.json({"message": "File uploaded successfully.", "file_path": file_path})

# Manage Environments Endpoints
@app.get("/db/environments")
async def get_db_environments(request: Request):
    user_id = request.args.get("user_id")
    env_name = request.args.get("envname")
    
    if not user_id:
        return response.json({"message": "User ID is required."}, status=400)
    
    if env_name:
        query = "SELECT Path_to_Env FROM Environment WHERE EnvironmentName=%s AND User_ID=%s;"
        params = (env_name, user_id)
    else:
        query = "SELECT Path_to_Env, EnvironmentName FROM Environment WHERE User_ID=%s;"
        params = (user_id,)
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            environments = await cur.fetchall()
    
    return response.json({"environments": environments})

@app.post("/db/environments")
async def upload_db_environment(request: Request):
    data = request.json
    user_id = data.get("user_id")
    env_name = data.get("env_name")
    
    if not user_id or not env_name:
        return response.json({"message": "User ID and environment name are required."}, status=400)
    
    new_env_path = f"server-folder/environments/{env_name}"
    
    query = """
        INSERT INTO Environment (User_ID, Path_to_Env, EnvironmentName)
        VALUES (%s, %s, %s);
    """
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, (user_id, new_env_path, env_name))
    
    return response.json({"message": "Database environment uploaded successfully.", "path": new_env_path})

@app.patch("/db/environments")
async def update_db_environment(request: Request):
    data = request.json
    environment_id = data.get("environment_id")
    updates = data.get("updates")
    
    if not environment_id or not updates:
        return response.json({"message": "Environment ID and updates are required."}, status=400)
    
    set_clause = ", ".join([f"{key}=%s" for key in updates.keys()])
    values = list(updates.values())
    values.append(environment_id)
    
    query = f"UPDATE Environment SET {set_clause} WHERE Env_ID=%s;"
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, tuple(values))
    
    return response.json({"message": "Database environment updated successfully."})

@app.delete("/db/environments")
async def delete_db_environment(request: Request):
    environment_name = request.args.get("environment_name")
    user_id = request.args.get("user_id")
    
    if not environment_name or not user_id:
        return response.json({"message": "Environment name and user ID are required."}, status=400)
    
    query = "DELETE FROM Environment WHERE EnvironmentName=%s AND User_ID=%s;"
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, (environment_name, user_id))
    
    return response.json({"message": "Database environment deleted successfully."})

# Manage Templates Endpoints
@app.get("/db/templates")
async def get_db_templates(request: Request):
    user_id = request.args.get("user_id")
    
    if not user_id:
        return response.json({"message": "User ID is required."}, status=400)
    
    query = """
        SELECT T.Templ_ID, T.Path_to_Templ
        FROM Templates T
        JOIN UserTemplateMap UTM ON T.Templ_ID = UTM.Templ_ID
        WHERE UTM.User_ID = %s;
    """
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, (user_id,))
            templates = await cur.fetchall()
    
    return response.json({"templates": templates})

@app.post("/db/templates")
async def upload_db_template(request: Request):
    data = request.json
    user_id = data.get("user_id")
    template_path = data.get("template_path")
    template_name = data.get("template_name")
    
    if not user_id or not template_path or not template_name:
        return response.json({"message": "User ID, template path, and template name are required."}, status=400)
    
    query = """
        INSERT INTO Templates (Owner_ID, Path_to_Templ)
        VALUES (%s, %s);
    """
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, (user_id, template_path))
            templ_id = cur.lastrowid
    
    map_query = """
        INSERT INTO UserTemplateMap (User_ID, Templ_ID, TemplateName)
        VALUES (%s, %s, %s);
    """
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(map_query, (user_id, templ_id, template_name))
    
    return response.json({"message": "Database template uploaded successfully.", "templ_id": templ_id})

@app.patch("/db/templates")
async def upgrade_db_template(request: Request):
    data = request.json
    environment_name = data.get("environment_name")
    new_template_path = data.get("new_template_path")
    
    if not environment_name or not new_template_path:
        return response.json({"message": "Environment name and new template path are required."}, status=400)
    
    query = """
        SELECT E.User_ID, T.Templ_ID
        FROM Environment E
        JOIN UserTemplateMap UTM ON E.User_ID = UTM.User_ID
        JOIN Templates T ON UTM.Templ_ID = T.Templ_ID
        WHERE E.EnvironmentName = %s;
    """
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, (environment_name,))
            record = await cur.fetchone()
    
    if not record:
        return response.json({"message": "Environment not found."}, status=404)
    
    user_id = record['User_ID']
    templ_id = record['Templ_ID']
    
    update_query = "UPDATE Templates SET Path_to_Templ = %s WHERE Templ_ID = %s;"
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(update_query, (new_template_path, templ_id))
    
    return response.json({"message": "Database template upgraded successfully.", "new_template_path": new_template_path})

@app.delete("/db/templates")
async def delete_db_template(request: Request):
    template_name = request.args.get("template_name")
    user_id = request.args.get("user_id")
    
    if not template_name or not user_id:
        return response.json({"message": "Template name and user ID are required."}, status=400)
    
    query = """
        SELECT UTM.Templ_ID
        FROM UserTemplateMap UTM
        JOIN Templates T ON UTM.Templ_ID = T.Templ_ID
        WHERE UTM.TemplateName = %s AND UTM.User_ID = %s;
    """
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, (template_name, user_id))
            record = await cur.fetchone()
    
    if not record:
        return response.json({"message": "Template not found."}, status=404)
    
    templ_id = record['Templ_ID']
    
    delete_map_query = "DELETE FROM UserTemplateMap WHERE Templ_ID = %s AND User_ID = %s;"
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(delete_map_query, (templ_id, user_id))
    
    delete_template_query = "DELETE FROM Templates WHERE Templ_ID = %s;"
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(delete_template_query, (templ_id,))
    
    return response.json({"message": "Database template deleted successfully."})

# Manage Users Endpoints
@app.get("/users")
async def get_users(request: Request):
    user_id = request.args.get("user_id")
    
    if not user_id:
        return response.json({"message": "User ID is required."}, status=400)
    
    query = "SELECT User_ID, Email, User_Type FROM Users WHERE User_ID = %s;"
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, (user_id,))
            user = await cur.fetchone()
    
    if user:
        return response.json({"user": user})
    else:
        return response.json({"message": "User not found."}, status=404)

@app.post("/users")
async def create_user(request: Request):
    data = request.json
    email = data.get("email")
    password = data.get("password")
    user_type = data.get("user_type", 1)
    group_id = data.get("group_id")
    
    if not email or not password or not group_id:
        return response.json({"message": "Email, password, and group ID are required."}, status=400)
    
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return response.json({"message": "Invalid email format."}, status=400)
    
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    
    
    query = """
        INSERT INTO Users (Email, Pssw, User_Type, Group_ID)
        VALUES (%s, %s, %s, %s);
    """
    
    try:
        async with app.ctx.db_pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (email, hashed_password, user_type, group_id))
                user_id = cur.lastrowid
    except aiomysql.IntegrityError:
        return response.json({"message": "Email already exists."}, status=409)
    
    return response.json({"message": "User created successfully.", "user_id": user_id}, status=201)

@app.delete("/users")
async def delete_user(request: Request):
    user_id = request.args.get("user_id")
    
    if not user_id:
        return response.json({"message": "User ID is required."}, status=400)
    
    delete_query = "DELETE FROM Users WHERE User_ID = %s;"
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(delete_query, (user_id,))
    
    return response.json({"message": "User deleted successfully."})

@app.post("/users/reset-password")
async def reset_password(request: Request):
    data = request.json
    email = data.get("email")
    new_password = data.get("new_password")
    
    if not email or not new_password:
        return response.json({"message": "Email and new password are required."}, status=400)
    
    hashed_password = hashlib.sha256(new_password.encode()).hexdigest()
    
    query = "UPDATE Users SET Pssw = %s WHERE Email = %s;"
    
    async with app.ctx.db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, (hashed_password, email))
            if cur.rowcount == 0:
                return response.json({"message": "Email not found."}, status=404)
    
    return response.json({"message": "Password reset successfully."})

@app.post("/users/reset-username")
async def reset_username(request: Request):
    data = request.json
    email = data.get("email")
    new_email = data.get("new_email")
    
    if not email or not new_email:
        return response.json({"message": "Current email and new email are required."}, status=400)
    
    if not re.match(r"[^@]+@[^@]+\.[^@]+", new_email):
        return response.json({"message": "Invalid new email format."}, status=400)
    
    query = "UPDATE Users SET Email = %s WHERE Email = %s;"
    
    try:
        async with app.ctx.db_pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (new_email, email))
                if cur.rowcount == 0:
                    return response.json({"message": "Current email not found."}, status=404)
    except aiomysql.IntegrityError:
        return response.json({"message": "New email already in use."}, status=409)
    
    return response.json({"message": "Email reset successfully."})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
