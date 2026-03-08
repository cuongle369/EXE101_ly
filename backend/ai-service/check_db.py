import sqlite3
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('cafe_manager.db')
cursor = conn.cursor()

cursor.execute('SELECT id, title FROM tasks')
print('TASKS:')
for row in cursor.fetchall():
    print(f"  {row}")

cursor.execute('SELECT id, task_id, member_id, assigned_amount FROM assignments')
print('ASSIGNMENTS:')
for row in cursor.fetchall():
    print(f"  {row}")

conn.close()
