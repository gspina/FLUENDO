import mysql.connector
from mysql.connector import Error

# Parametri di connessione
host = "localhost"  # Es.: "localhost" o un indirizzo IP
database = "my_database"  # Nome del database
user = "my_user"  # Username MySQL
password = "secure_password"  # Password MySQL

try:
    # Connessione al database
    connection = mysql.connector.connect(
        host=host,
        database=database,
        user=user,
        password=password
    )

    if connection.is_connected():
        print("Connessione al database MySQL avvenuta con successo")

        # Creazione del cursore per eseguire query
        cursor = connection.cursor()

        # Esecuzione di una query
        query = "SELECT * FROM Users;"  # Cambia con la tua query SQL
        cursor.execute(query)

        # Lettura dei risultati
        results = cursor.fetchall()
        for row in results:
            print(row)

except Error as e:
    print(f"Errore durante la connessione a MySQL: {e}")

finally:
    # Chiusura della connessione
    if connection.is_connected():
        cursor.close()
        connection.close()
        print("Connessione al database MySQL chiusa")
