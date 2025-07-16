# Estendi l'immagine esistente 'tensorcustom:0.2'
FROM tensorcustom:0.2

# Imposta la variabile d'ambiente per protobuf (soluzione per il TypeError)
ENV PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python
ENV PYTHONPATH="/usr/local/lib/python3.9/site-packages:$PYTHONPATH"

# Imposta la cartella di lavoro nel contenitore
WORKDIR /home/zerod/lab/jupyterlab/jupyter-extension-project/jupyter-workflow/examples/tensorflow/work/docker-custom-tff

# Copia il file requirements.txt nel contenitore
COPY requirementstff.txt .

COPY --from=ghcr.io/astral-sh/uv:0.7.13 /uv /uvx /bin/

# Disinstalla protobuf esistente e rimuove tutte le versioni di protobuf
RUN pip freeze | grep protobuf | awk '{print $1}' | xargs pip uninstall -y

# Installa la versione corretta di protobuf

# Pulisce la cache di pip
RUN pip cache purge

# Installa le dipendenze da requirements.txt (forza reinstallazione per conflitti)
RUN uv pip install --no-cache-dir -r requirementstff.txt --system --force-reinstall

# RUN curl -LO https://github.com/protocolbuffers/protobuf/releases/download/v3.19.0/protobuf-all-3.19.0.tar.gz && \
#     tar -xzf protobuf-all-3.19.0.tar.gz && \
#     cd protobuf-3.19.0 && \
#     ./configure && \
#     make && \
#     make install
    
# RUN uv pip install --no-cache-dir protobuf==3.20.3 --system --force-reinstall
RUN  pip3 install --upgrade ipython

# Specifica il comando predefinito per eseguire l'app (modifica in base alla tua applicazione) IL CONTAINER DEVE RIMANERE IN ATTESA QUINDI TAIL DI DEV NULL
CMD ["tail", "-f", "/dev/null"]
