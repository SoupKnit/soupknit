rm -rf public/jupy_lite

# Build the extention project first
cd jupyter-lab-ext

pip install -ve .
pip install jupyterlab

jlpm run build

cd ../public

# Create static assets for the jupyter lab ext
jupyter lite build --output-dir jupy_lite

# Build the UI
yarn --frozen-lockfile install --production; yarn build
