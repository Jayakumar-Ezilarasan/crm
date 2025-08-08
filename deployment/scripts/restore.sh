#!/bin/bash

# CRM Database Restore Script
# This script restores the PostgreSQL database from backup

set -e

# Configuration
BACKUP_DIR="/backups"
LOG_FILE="/var/log/restore.log"

# Environment variables
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"crm_production"}
DB_USER=${DB_USER:-"crm_user"}
DB_PASSWORD=${DB_PASSWORD}

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

# Function to list available backups
list_backups() {
    log "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -la "$BACKUP_DIR"/crm_backup_*.sql.gz 2>/dev/null || echo "No local backups found"
    fi
    
    # List S3 backups if configured
    if [ -n "$S3_BUCKET" ]; then
        log "S3 backups:"
        aws s3 ls "s3://$S3_BUCKET/database-backups/" | grep "crm_backup_.*\.sql\.gz$" || echo "No S3 backups found"
    fi
    
    # List GCS backups if configured
    if [ -n "$GCS_BUCKET" ]; then
        log "GCS backups:"
        gsutil ls "gs://$GCS_BUCKET/database-backups/" | grep "crm_backup_.*\.sql\.gz$" || echo "No GCS backups found"
    fi
}

# Function to download backup from cloud storage
download_backup() {
    local backup_file="$1"
    
    if [[ "$backup_file" == s3://* ]]; then
        log "Downloading backup from S3: $backup_file"
        aws s3 cp "$backup_file" "$BACKUP_DIR/"
        echo "$BACKUP_DIR/$(basename "$backup_file")"
    elif [[ "$backup_file" == gs://* ]]; then
        log "Downloading backup from GCS: $backup_file"
        gsutil cp "$backup_file" "$BACKUP_DIR/"
        echo "$BACKUP_DIR/$(basename "$backup_file")"
    else
        echo "$backup_file"
    fi
}

# Function to restore database
restore_database() {
    local backup_file="$1"
    local dry_run="${2:-false}"
    
    log "Starting database restore from: $backup_file"
    
    # Check if backup file exists
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    # Set PGPASSWORD for pg_restore
    export PGPASSWORD="$DB_PASSWORD"
    
    if [ "$dry_run" = "true" ]; then
        log "DRY RUN: Would restore database from $backup_file"
        log "DRY RUN: Database would be dropped and recreated"
        return 0
    fi
    
    # Drop existing database if it exists
    log "Dropping existing database..."
    dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" --if-exists "$DB_NAME" 2>/dev/null || true
    
    # Create new database
    log "Creating new database..."
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    
    # Restore from backup
    log "Restoring database from backup..."
    if [[ "$backup_file" == *.gz ]]; then
        # Compressed backup
        gunzip -c "$backup_file" | pg_restore \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --verbose \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges
    else
        # Uncompressed backup
        pg_restore \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --verbose \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        log "Database restore completed successfully"
    else
        error_exit "Database restore failed"
    fi
}

# Function to verify restore
verify_restore() {
    log "Verifying database restore..."
    
    # Set PGPASSWORD
    export PGPASSWORD="$DB_PASSWORD"
    
    # Check if database exists and has tables
    table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$table_count" ] && [ "$table_count" -gt 0 ]; then
        log "Restore verification successful: $table_count tables found"
    else
        log "WARNING: Restore verification failed - no tables found"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [BACKUP_FILE]"
    echo ""
    echo "Options:"
    echo "  -l, --list              List available backups"
    echo "  -d, --dry-run           Show what would be restored without actually restoring"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --list                                    # List available backups"
    echo "  $0 crm_backup_20231201_120000.sql.gz         # Restore from local backup"
    echo "  $0 s3://bucket/database-backups/backup.sql.gz # Restore from S3"
    echo "  $0 gs://bucket/database-backups/backup.sql.gz # Restore from GCS"
    echo "  $0 --dry-run backup.sql.gz                   # Dry run restore"
}

# Main execution
main() {
    local backup_file=""
    local list_backups_flag=false
    local dry_run_flag=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -l|--list)
                list_backups_flag=true
                shift
                ;;
            -d|--dry-run)
                dry_run_flag=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                error_exit "Unknown option: $1"
                ;;
            *)
                backup_file="$1"
                shift
                ;;
        esac
    done
    
    log "=== Starting CRM Database Restore Process ==="
    
    # List backups if requested
    if [ "$list_backups_flag" = "true" ]; then
        list_backups
        exit 0
    fi
    
    # Check if backup file is provided
    if [ -z "$backup_file" ]; then
        error_exit "Backup file must be specified. Use --help for usage information."
    fi
    
    # Download backup if it's from cloud storage
    local local_backup_file
    local_backup_file=$(download_backup "$backup_file")
    
    # Restore database
    restore_database "$local_backup_file" "$dry_run_flag"
    
    # Verify restore (skip for dry run)
    if [ "$dry_run_flag" = "false" ]; then
        verify_restore
    fi
    
    log "=== Restore Process Completed Successfully ==="
}

# Run main function
main "$@"
