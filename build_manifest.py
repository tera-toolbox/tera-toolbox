import os
import json
import hashlib

def is_blacklisted(file):
    (head, tail) = os.path.split(os.path.normpath(file))
    return any(head.startswith(dir) for dir in {
        '.git',
        'mods',
    }) or file in {
        'build_manifest.py',
        'manifest.json',
        'config.json',
    }

def list_files(dir):
    files = [os.path.normpath(os.path.join(root, f)).replace('\\', '/') for root, dirs, files in os.walk(dir) for f in files]
    return [f for f in files if not is_blacklisted(f)]

def hash(files):
    hashes = {}
    for path in files:
        with open(path, 'rb') as fh:
            data = fh.read()
        hashes[path] = hashlib.sha256(data).hexdigest()
        
        if path in ('TeraProxy.bat', 'TeraProxyGUI.bat'):
            hashes[path] = {'hash': hashes[path], 'overwrite': 'only'}
            
    return hashes

manifest = {'files': hash(list_files('./'))}

with open('manifest.json', 'w') as fh:
    #fh.write(json.dumps(manifest).replace(' ', ''))
    fh.write(json.dumps(manifest, indent=2)) # for better diff readability
