-- Local development role. Production must provision a separately stored, strong password.
CREATE ROLE ramu_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD 'ramu_app_local_password';
GRANT CONNECT ON DATABASE ramu TO ramu_app;
