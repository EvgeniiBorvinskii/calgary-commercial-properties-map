#!/usr/bin/env python3
import subprocess
import os

os.chdir('/srv/calgary.ypilo.com')
subprocess.run(['npm', 'run', 'start'], env={**os.environ, 'PORT': '3052'})
