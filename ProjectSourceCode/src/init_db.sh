#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://users_db_8ny1_user:3i9TAPFsl3zGOBut91ocVlsHD32ZkGLH@dpg-d000fhruibrs73brnr60-a.virginia-postgres.render.com/users_db_8ny1"

# Execute each .sql file in the directory
for file in init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done