#!/bin/bash
cd ..
#pip install -ve .
jlpm install
jlpm build
jupyter labextension develop . --overwrite
jupyter lab build
