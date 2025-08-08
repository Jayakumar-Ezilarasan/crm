#!/bin/bash

# CRM Database Backup Script
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="crm_backup_${DATE}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
LOG_FILE="/var/log/backup.log"

# Environment variables (set these in your deployment)
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"crm_production"}
DB_USER=${DB_USER:-"crm_user"}
DB_PASSWORD=${DB_PASSWORD}

# Cloud storage configuration (optional)
S3_BUCKET=${S3_BUCKET:-""}
GCS_BUCKET=${GCS_BUCKET:-""}

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check if required environment variables are set
if [ -z "$DB_PASSWORD" ]; then
    error_exit "DB_PASSWORD environment variable is required"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to create backup
create_backup() {
    log "Starting database backup..."
    
    # Set PGPASSWORD for pg_dump
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create backup with pg_dump
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --no-owner \
        --no-privileges \
        --format=custom \
        --file="$BACKUP_DIR/$BACKUP_FILE" \
        2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log "Database backup completed successfully: $BACKUP_FILE"
    else
        error_exit "Database backup failed"
    fi
}

# Function to compress backup
compress_backup() {
    log "Compressing backup file..."
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    if [ $? -eq 0 ]; then
        log "Backup compressed: $COMPRESSED_FILE"
    else
        error_exit "Backup compression failed"
    fi
}

# Function to upload to S3 (if configured)
upload_to_s3() {
    if [ -n "$S3_BUCKET" ]; then
        log "Uploading backup to S3..."
        aws s3 cp "$BACKUP_DIR/$COMPRESSED_FILE" "s3://$S3_BUCKET/database-backups/" \
            --storage-class STANDARD_IA \
            2>> "$LOG_FILE"
        
        if [ $? -eq 0 ]; then
            log "Backup uploaded to S3 successfully"
        else
            log "WARNING: S3 upload failed"
        fi
    fi
}

# Function to upload to Google Cloud Storage (if configured)
upload_to_gcs() {
    if [ -n "$GCS_BUCKET" ]; then
        log "Uploading backup to Google Cloud Storage..."
        gsutil cp "$BACKUP_DIR/$COMPRESSED_FILE" "gs://$GCS_BUCKET/database-backups/" \
            2>> "$LOG_FILE"
        
        if [ $? -eq 0 ]; then
            log "Backup uploaded to GCS successfully"
        else
            log "WARNING: GCS upload failed"
        fi
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Remove local backups
    find "$BACKUP_DIR" -name "crm_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Remove S3 backups (if configured)
    if [ -n "$S3_BUCKET" ]; then
        aws s3 ls "s3://$S3_BUCKET/database-backups/" | \
        awk '{print $4}' | \
        grep "crm_backup_.*\.sql\.gz$" | \
        while read file; do
            # Extract date from filename and check if older than retention
            file_date=$(echo "$file" | sed 's/crm_backup_\([0-9]\{8\}\)_.*/\1/')
            if [ -n "$file_date" ]; then
                file_timestamp=$(date -d "$file_date" +%s)
                current_timestamp=$(date +%s)
                days_old=$(( (current_timestamp - file_timestamp) / 86400 ))
                
                if [ $days_old -gt $RETENTION_DAYS ]; then
                    aws s3 rm "s3://$S3_BUCKET/database-backups/$file"
                    log "Removed old S3 backup: $file"
                fi
            fi
        done
    fi
    
    # Remove GCS backups (if configured)
    if [ -n "$GCS_BUCKET" ]; then
        gsutil ls "gs://$GCS_BUCKET/database-backups/" | \
        grep "crm_backup_.*\.sql\.gz$" | \
        while read file; do
            # Extract date from filename and check if older than retention
            file_date=$(echo "$file" | sed 's/.*crm_backup_\([0-9]\{8\}\)_.*/\1/')
            if [ -n "$file_date" ]; then
                file_timestamp=$(date -d "$file_date" +%s)
                current_timestamp=$(date +%s)
                days_old=$(( (current_timestamp - file_timestamp) / 86400 ))
                
                if [ $days_old -gt $RETENTION_DAYS ]; then
                    gsutil rm "$file"
                    log "Removed old GCS backup: $file"
                fi
            fi
        done
    fi
}

# Function to verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    # Test restore to temporary database
    TEMP_DB="crm_backup_test_${DATE}"
    
    # Create temporary database
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_DB" 2>/dev/null || true
    
    # Try to restore backup
    pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$TEMP_DB" \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        "$BACKUP_DIR/$BACKUP_FILE" \
        2>/dev/null
    
    if [ $? -eq 0 ]; then
        log "Backup verification successful"
        # Drop temporary database
        dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_DB" 2>/dev/null || true
    else
        log "WARNING: Backup verification failed"
        # Drop temporary database
        dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_DB" 2>/dev/null || true
    fi
}

# Main execution
main() {
    log "=== Starting CRM Database Backup Process ==="
    
    # Create backup
    create_backup
    
    # Compress backup
    compress_backup
    
    # Upload to cloud storage
    upload_to_s3
    upload_to_gcs
    
    # Verify backup integrity
    verify_backup
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "=== Backup Process Completed Successfully ==="
}

# Run main function
main "$@"
