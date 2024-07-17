#!/bin/bash

rm -rf public/jupy_lite

# Build the extention project first
cd jupyter-lab-ext || exit

pip install -ve .
jupyter labextension develop --overwrite .

pip install jupyter
pip install jupyterlite-core
pip install jupyterlite-pyodide-kernel
pip install jupyterlab

jlpm install
jlpm run build

jupyter labextension list

# Create static assets for the jupyter lab ext
jupyter lite build --output-dir ../../public/jupy_lite

# Build the UI
# yarn --frozen-lockfile install; yarn build