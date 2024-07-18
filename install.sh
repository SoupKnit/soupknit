#!/bin/bash

rm -rf public/jupy_lite

# Build the extention project first
cd jupyter-lab-ext || exit

python3 -m pip install jupyter
python3 -m pip install jupyterlite-core
python3 -m pip install jupyterlite-pyodide-kernel
python3 -m pip install jupyterlab

export PATH="$HOME/.local/bin:$PATH"
jupyter labextension develop --overwrite .
jlpm install
python3 -m pip install -ve . --user
jlpm run build

# Create static assets for the jupyter lab ext
jupyter lite build --output-dir ../public/jupy_lite

# Modify jupyter-lite.json to include exposeAppInBrowser
JUPYTER_LITE_JSON="../public/jupy_lite/jupyter-lite.json"
if [ -f "$JUPYTER_LITE_JSON" ]; then
    # Use Python to modify the JSON file
    python3 - <<EOF
import json
with open('$JUPYTER_LITE_JSON', 'r') as f:
    config = json.load(f)
config.setdefault('jupyter-config-data', {})['exposeAppInBrowser'] = True
with open('$JUPYTER_LITE_JSON', 'w') as f:
    json.dump(config, f, indent=2)
EOF
    echo "Added exposeAppInBrowser to jupyter-lite.json using Python"
else
    echo "Error: jupyter-lite.json not found"
    exit 1
fi

jupyter labextension list

# Build the UI
# yarn --frozen-lockfile install; yarn build