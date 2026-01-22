#!/usr/bin/env python3
"""
Windows C: Drive Cleanup Utility
Safely removes junk files and identifies large files with dry-run support.
"""

import os
import sys
import shutil
import logging
import datetime
import platform
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Set, Any

# Configuration
LARGE_FILE_THRESHOLD_MB = 500

class WindowsCleanupTool:
    def __init__(self, dry_run: bool = True, verbose: bool = False):
        self.dry_run = dry_run
        self.verbose = verbose
        self.log_file = f"cleanup_log_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        self._setup_logging()
        self.logger = logging.getLogger("WindowsCleanupTool")
        self.total_freed_bytes = 0
        self.action_log: List[str] = []
        self.large_files_found: List[Dict[str, Any]] = []

    def _setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )

    def is_windows(self) -> bool:
        return platform.system() == "Windows"

    def is_admin(self) -> bool:
        if not self.is_windows():
            return False
        try:
            import ctypes
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        except Exception:
            return False

    def get_free_space(self, path: str = "C:\\") -> int:
        if not self.is_windows():
             return 0
        try:
            usage = shutil.disk_usage(path)
            return usage.free
        except Exception as e:
            self.logger.debug(f"Could not get free space for {path}: {e}")
            return 0

    def format_size(self, size_bytes: int) -> str:
        if size_bytes == 0:
            return "0B"
        size_name = ("B", "KB", "MB", "GB", "TB")
        i = 0
        while size_bytes >= 1024 and i < len(size_name) - 1:
            size_bytes /= 1024.0
            i += 1
        return f"{size_bytes:.2f} {size_name[i]}"

    def safe_delete(self, path: Path, remove_top_dir: bool = True) -> int:
        """Safely deletes a file or directory contents and returns the space freed."""
        if not path.exists():
            return 0

        size = self.get_path_size(path)
        
        if self.dry_run:
            self.logger.info(f"[DRY RUN] Would delete: {path} ({self.format_size(size)})")
            self.action_log.append(f"DRY RUN: Skip deletion of {path}")
            return size

        try:
            if path.is_file() or path.is_symlink():
                path.unlink()
                self.logger.info(f"Deleted: {path} ({self.format_size(size)})")
                self.action_log.append(f"DELETED: {path} ({self.format_size(size)})")
            elif path.is_dir():
                if remove_top_dir:
                    shutil.rmtree(path)
                    self.logger.info(f"Deleted Directory: {path} ({self.format_size(size)})")
                    self.action_log.append(f"DELETED DIR: {path} ({self.format_size(size)})")
                else:
                    # Only delete contents
                    freed_in_dir = 0
                    for item in path.iterdir():
                        freed_in_dir += self.safe_delete(item, remove_top_dir=True)
                    return freed_in_dir
            
            return size
        except PermissionError:
            self.logger.debug(f"Permission denied: {path}")
            self.action_log.append(f"SKIP: Permission denied for {path}")
            return 0
        except Exception as e:
            self.logger.error(f"Failed to delete {path}: {e}")
            self.action_log.append(f"ERROR: Could not delete {path} - {e}")
            return 0

    def get_path_size(self, path: Path) -> int:
        if not path.exists():
            return 0
        if path.is_file():
            try:
                return path.stat().st_size
            except Exception:
                return 0
        
        total_size = 0
        try:
            for dirpath, dirnames, filenames in os.walk(path):
                for f in filenames:
                    fp = os.path.join(dirpath, f)
                    if not os.path.islink(fp):
                        try:
                            total_size += os.path.getsize(fp)
                        except Exception:
                            continue
        except Exception:
            pass
        return total_size

    def cleanup_temp_files(self):
        self.logger.info("Cleaning up Temporary Files...")
        temp_paths = [
            Path(os.environ.get('TEMP', '')),
            Path(os.environ.get('SystemRoot', 'C:\\Windows'), 'Temp'),
            Path(os.environ.get('LocalAppData', ''), 'Temp')
        ]
        
        for base_path in temp_paths:
            if not base_path or str(base_path) == '.' or not base_path.exists():
                continue
            
            self.logger.info(f"Scanning {base_path}...")
            # Use remove_top_dir=False to keep the main temp directories
            self.total_freed_bytes += self.safe_delete(base_path, remove_top_dir=False)

    def cleanup_windows_update(self):
        self.logger.info("Cleaning up Windows Update downloads...")
        update_path = Path(os.environ.get('SystemRoot', 'C:\\Windows'), 'SoftwareDistribution\\Download')
        if update_path.exists():
            # Use remove_top_dir=False to keep the Download directory
            self.total_freed_bytes += self.safe_delete(update_path, remove_top_dir=False)

    def cleanup_recycle_bin(self):
        self.logger.info("Emptying Recycle Bin...")
        if not self.dry_run:
            try:
                subprocess.run(["powershell", "-Command", "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"], capture_output=True)
                self.logger.info("Recycle Bin emptied (via PowerShell)")
            except Exception as e:
                self.logger.error(f"Failed to empty Recycle Bin: {e}")
        else:
            self.logger.info("[DRY RUN] Would empty Recycle Bin")

    def cleanup_browser_caches(self):
        self.logger.info("Cleaning up Browser Caches...")
        local_app_data = Path(os.environ.get('LocalAppData', ''))
        app_data = Path(os.environ.get('AppData', ''))
        
        cache_paths = []
        
        # Chrome
        chrome_user_data = local_app_data / "Google/Chrome/User Data"
        if chrome_user_data.exists():
            cache_paths.extend(list(chrome_user_data.glob("*/Cache")))
            cache_paths.extend(list(chrome_user_data.glob("*/Code Cache")))
            
        # Edge
        edge_user_data = local_app_data / "Microsoft/Edge/User Data"
        if edge_user_data.exists():
            cache_paths.extend(list(edge_user_data.glob("*/Cache")))
            cache_paths.extend(list(edge_user_data.glob("*/Code Cache")))

        # Firefox (needs globbing for profiles)
        if app_data.exists():
            cache_paths.extend(list(app_data.glob("Mozilla/Firefox/Profiles/*/cache2")))
        
        for path in cache_paths:
            if path.exists():
                self.logger.info(f"Cleaning browser cache: {path}")
                self.total_freed_bytes += self.safe_delete(path, remove_top_dir=False)

    def cleanup_thumbnails(self):
        self.logger.info("Cleaning up Thumbnail Cache...")
        thumb_path = Path(os.environ.get('LocalAppData', '')) / "Microsoft/Windows/Explorer"
        if thumb_path.exists():
            for item in thumb_path.glob("thumbcache_*.db"):
                self.total_freed_bytes += self.safe_delete(item)

    def cleanup_shader_cache(self):
        self.logger.info("Cleaning up DirectX Shader Cache...")
        shader_paths = [
            Path(os.environ.get('LocalAppData', '')) / "D3DPSC",
            Path(os.environ.get('LocalAppData', '')) / "NVIDIA/DXCache",
            Path(os.environ.get('LocalAppData', '')) / "AMD/DxCache"
        ]
        for path in shader_paths:
            if path.exists():
                self.total_freed_bytes += self.safe_delete(path, remove_top_dir=False)

    def detect_large_files(self, search_path: str = None, min_size_mb: int = LARGE_FILE_THRESHOLD_MB):
        if search_path is None:
            search_path = os.environ.get('USERPROFILE', 'C:\\Users')
        
        if not search_path or not os.path.exists(search_path):
            self.logger.warning(f"Search path {search_path} does not exist.")
            return

        self.logger.info(f"Scanning for files larger than {min_size_mb}MB in {search_path}...")
        min_size_bytes = min_size_mb * 1024 * 1024
        
        exclude_dirs = {
            'AppData', 'Local Settings', 'Application Data', 'Windows', 
            'Program Files', 'Program Files (x86)', 'node_modules', '.git', '.svn'
        }
        
        file_count = 0
        for root, dirs, files in os.walk(search_path):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('$')]
            
            for f in files:
                file_count += 1
                if file_count % 2000 == 0:
                    print(f"  Scanned {file_count} files...", end='\r')
                
                fp = Path(root) / f
                try:
                    if fp.is_file() and not fp.is_symlink():
                        size = fp.stat().st_size
                        if size > min_size_bytes:
                            category = self._categorize_file(fp)
                            self.large_files_found.append({
                                'path': str(fp),
                                'size': size,
                                'category': category
                            })
                except (PermissionError, OSError):
                    continue
        print(f"\n  Scan complete. Scanned {file_count} files.")

    def _categorize_file(self, path: Path) -> str:
        ext = path.suffix.lower()
        if ext in {'.mp4', '.mkv', '.avi', '.mov', '.wmv'}:
            return "Video"
        if ext in {'.zip', '.rar', '.7z', '.tar', '.gz'}:
            return "Archive"
        if ext in {'.iso', '.img', '.vhd', '.vmdk'}:
            return "Disk Image"
        if ext in {'.exe', '.msi', '.dmg'}:
            return "Installer"
        if ext in {'.bak', '.old', '.tmp'}:
            return "Backup/Temp"
        return "Other"

    def run_win_sxs_cleanup(self):
        if not self.is_admin():
            self.logger.warning("WinSxS cleanup requires Administrator privileges. Skipping.")
            return

        self.logger.info("Running WinSxS cleanup (DISM)... This may take a while.")
        if self.dry_run:
            self.logger.info("[DRY RUN] Would run: dism.exe /online /cleanup-image /startcomponentcleanup")
            return

        try:
            subprocess.run(["dism.exe", "/online", "/cleanup-image", "/startcomponentcleanup"], check=True)
            self.logger.info("WinSxS cleanup completed.")
        except Exception as e:
            self.logger.error(f"Failed to run WinSxS cleanup: {e}")

    def save_undo_log(self):
        undo_file = f"cleanup_actions_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        try:
            with open(undo_file, 'w') as f:
                f.write("Windows Cleanup Tool Action Log\n")
                f.write(f"Timestamp: {datetime.datetime.now()}\n")
                f.write("-" * 40 + "\n")
                f.write("\n".join(self.action_log))
            self.logger.info(f"Action log saved to {undo_file}")
        except Exception as e:
            self.logger.error(f"Failed to save action log: {e}")

    def run(self):
        print("="*60)
        print("   Windows C: Drive Cleanup Utility")
        print("="*60)

        if not self.is_windows():
            print("ERROR: This tool is designed for Windows only.")
            # Even though we are on Linux, we provide the code for the user.
            if os.environ.get('IGNORE_WINDOWS_CHECK') != '1':
                return

        if not self.is_admin():
            print("WARNING: Not running as Administrator. Some system files cannot be cleaned.")
            print("Please restart with Administrator privileges for full cleanup.")
            print("-"*60)

        free_before = self.get_free_space()
        print(f"Initial free space: {self.format_size(free_before)}")
        
        targets = [
            ("Temporary Files", self.cleanup_temp_files),
            ("Windows Update Cache", self.cleanup_windows_update),
            ("Recycle Bin", self.cleanup_recycle_bin),
            ("Browser Caches", self.cleanup_browser_caches),
            ("Thumbnail Cache", self.cleanup_thumbnails),
            ("DirectX Shader Cache", self.cleanup_shader_cache),
            ("WinSxS Component Cleanup (Slow, Admin only)", self.run_win_sxs_cleanup)
        ]
        
        print("\nAvailable Cleanup Targets:")
        for i, (name, _) in enumerate(targets, 1):
            print(f"{i}. {name}")
        
        choice = input("\nSelect targets to clean (e.g., 1,2,3 or 'all' or 'none'): ").strip().lower()
        
        selected_targets = []
        if choice == 'all':
            selected_targets = targets
        elif choice != 'none' and choice != '':
            try:
                indices = [int(i.strip()) - 1 for i in choice.split(',')]
                selected_targets = [targets[i] for i in indices if 0 <= i < len(targets)]
            except ValueError:
                print("Invalid input. Skipping automatic cleanups.")

        # Large File Detection
        large_files_to_delete = []
        detect_large = input("\nScan for large files (>500MB)? (y/n): ").strip().lower() == 'y'
        if detect_large:
            self.detect_large_files()
            if self.large_files_found:
                print(f"\nFound {len(self.large_files_found)} large files:")
                for i, file_info in enumerate(self.large_files_found, 1):
                    print(f"{i}. [{file_info['category']}] {file_info['path']} ({self.format_size(file_info['size'])})")
                
                to_delete = input("\nEnter numbers of large files to delete (e.g., 1,3) or 'none': ").strip().lower()
                if to_delete != 'none' and to_delete != '':
                    try:
                        indices = [int(i.strip()) - 1 for i in to_delete.split(',')]
                        for idx in indices:
                            if 0 <= idx < len(self.large_files_found):
                                file_info = self.large_files_found[idx]
                                large_files_to_delete.append(Path(file_info['path']))
                                # Temporarily add to total for dry run summary
                                self.total_freed_bytes += file_info['size']
                    except ValueError:
                        print("Invalid input.")

        # Execution
        if selected_targets or large_files_to_delete:
            if self.dry_run:
                print("\n" + "-"*40)
                print("RUNNING DRY RUN SUMMARY")
                print("-"*40)
                # Reset total_freed_bytes and recalculate during dry run summary
                self.total_freed_bytes = 0
                for name, func in selected_targets:
                    func()
                
                for path in large_files_to_delete:
                    self.total_freed_bytes += self.safe_delete(path)
                
                print(f"\nTotal potential space to free: {self.format_size(self.total_freed_bytes)}")
                confirm = input("\nDo you want to proceed with ACTUAL deletion? (y/n): ").strip().lower()
                if confirm == 'y':
                    self.dry_run = False
                    self.total_freed_bytes = 0 
                    self.action_log.append("--- STARTING ACTUAL DELETION ---")
                    for name, func in selected_targets:
                        func()
                    for path in large_files_to_delete:
                        self.total_freed_bytes += self.safe_delete(path)
                else:
                    print("Operation cancelled.")
            else:
                for name, func in selected_targets:
                    func()
                for path in large_files_to_delete:
                    self.total_freed_bytes += self.safe_delete(path)

        free_after = self.get_free_space()
        print("\n" + "="*60)
        print("   CLEANUP REPORT")
        print("="*60)
        print(f"Total space freed: {self.format_size(self.total_freed_bytes)}")
        if self.is_windows():
            print(f"Actual free space change: {self.format_size(max(0, free_after - free_before))}")
            print(f"Current free space: {self.format_size(free_after)}")
        print(f"Log file: {self.log_file}")
        self.save_undo_log()
        print("="*60)

if __name__ == "__main__":
    tool = WindowsCleanupTool(dry_run=True)
    try:
        tool.run()
    except KeyboardInterrupt:
        print("\nInterrupted by user. Exiting.")
    except Exception as e:
        logging.exception(f"An unexpected error occurred: {e}")
        print(f"\nAn error occurred: {e}")
