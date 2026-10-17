import os
import socket
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path=env_path)

# SQLite works without requiring a separately installed database server.
# Set DATABASE_URL in backend/.env when MySQL is explicitly desired.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./talkflow.db")

# Dynamic DB check: Probe if we can connect to MySQL
is_mysql_active = False
if DATABASE_URL.startswith("mysql"):
    try:
        # Extract host and port from url to probe
        url_str = DATABASE_URL.split("://")[1]
        if "@" in url_str:
            rest = url_str.split("@", 1)[1]
        else:
            rest = url_str
        
        if "/" in rest:
            host_port = rest.split("/", 1)[0]
        else:
            host_port = rest
            
        if ":" in host_port:
            host, port = host_port.split(":", 1)
            port = int(port)
        else:
            host, port = host_port, 3306
            
        # Quick socket check with a 1.5-second timeout
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1.5)
        s.connect((host, port))
        s.close()
        is_mysql_active = True
    except Exception:
        is_mysql_active = False

# Fallback to local SQLite if MySQL is down
if DATABASE_URL.startswith("mysql") and not is_mysql_active:
    print("[WARNING] XAMPP MySQL server is offline or unreachable. Falling back to local SQLite database (talkflow.db) to keep application online!")
    DATABASE_URL = "sqlite:///./talkflow.db"

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    # check_same_thread=False is strictly required by SQLite for multi-threaded FastAPI contexts
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL, 
    echo=os.getenv("SQL_ECHO", "0") == "1", 
    connect_args=connect_args
)

def init_db():
    """
    Invokes SQLModel metadata builder to generate database tables based on registered models.
    Ensures that the MySQL database is created if it does not exist, and migrates
    key fields to TEXT to prevent truncation errors.
    """
    if DATABASE_URL.startswith("mysql"):
        try:
            import pymysql
            from urllib.parse import urlparse
            
            # Parse connection details from the URL
            url_str = DATABASE_URL.split("://")[1]
            if "@" in url_str:
                auth, rest = url_str.split("@", 1)
                if ":" in auth:
                    username, password = auth.split(":", 1)
                else:
                    username, password = auth, ""
            else:
                username, password = "root", ""
                rest = url_str
            
            if "/" in rest:
                host_port, database = rest.split("/", 1)
                if "?" in database:
                    database = database.split("?", 1)[0]
            else:
                host_port, database = rest, "talkflow"
                
            if ":" in host_port:
                host, port = host_port.split(":", 1)
                port = int(port)
            else:
                host, port = host_port, 3306
                
            # Connect to MySQL server without database to create it
            conn = pymysql.connect(
                host=host,
                port=port,
                user=username,
                password=password
            )
            cursor = conn.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database}")
            conn.close()
            
            # Now run create_all
            SQLModel.metadata.create_all(engine)
            
            # Connect to MySQL database to perform ALTER queries ensuring columns are TEXT
            conn = pymysql.connect(
                host=host,
                port=port,
                user=username,
                password=password,
                db=database
            )
            cursor = conn.cursor()
            
            # Check existing columns type and modify if needed to prevent 255 char limits
            cursor.execute("ALTER TABLE studentprofile MODIFY COLUMN skills TEXT")
            cursor.execute("ALTER TABLE sessionhistory MODIFY COLUMN feedback TEXT")
            cursor.execute("ALTER TABLE chatmessage MODIFY COLUMN content TEXT")
            conn.commit()
            conn.close()
            print("Successfully verified/migrated MySQL tables and columns to TEXT.")
        except Exception as e:
            print(f"MySQL database initialization / migration warning: {e}")
            SQLModel.metadata.create_all(engine)
    else:
        SQLModel.metadata.create_all(engine)

def get_session():
    """
    Dependency generator yielding database sessions. 
    Handles session lifecycles automatically for requests.
    """
    with Session(engine) as session:
        yield session
