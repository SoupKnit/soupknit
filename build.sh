#!/bin/bash

rm -rf public/jupy_lite

# Build the extention project first
cd jupyter-lab-ext || exit

pip install -ve .
pip install jupyterlab
pip install jupyter

jlpm run build

cd ../public || exit

# Create static assets for the jupyter lab ext
jupyter lite build --output-dir jupy_lite

# Build the UI
# yarn --frozen-lockfile install; yarn build