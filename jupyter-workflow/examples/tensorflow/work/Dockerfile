# Estendi l'immagine esistente 'tensorcustom:0.2'
FROM nvidia/cuda:12.9.1-cudnn-devel-ubuntu20.04
# FROM nvidia/cuda:12.0-base

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y tzdata && \
    ln -fs /usr/share/zoneinfo/Europe/Rome /etc/localtime && \
    dpkg-reconfigure --frontend noninteractive tzdata

RUN apt install software-properties-common -y

RUN add-apt-repository -y 'ppa:deadsnakes/ppa'

RUN apt update && apt install python3.11-full wget -y 

RUN wget https://bootstrap.pypa.io/get-pip.py && python3.11 get-pip.py

# Imposta la variabile d'ambiente per protobuf (soluzione per il TypeError)
ENV PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python
ENV PYTHONPATH="/usr/local/lib/python3.9/site-packages:$PYTHONPATH"

# Imposta la cartella di lavoro nel contenitore
WORKDIR /home/zerod/lab/jupyterlab/jupyter-extension-project/jupyter-workflow/examples/tensorflow/work/docker-custom-tff


# Copia il file requirements.txt nel contenitore
COPY requirementstff.txt .

COPY --from=ghcr.io/astral-sh/uv:0.7.13 /uv /uvx /bin/

# Disinstalla protobuf esistente e rimuove tutte le versioni di protobuf
RUN python3.11 -m pip freeze ew2q

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


RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 && \
    ln -sf /usr/bin/python3.11 /usr/bin/python && \
    ln -sf /usr/bin/python3.11 /usr/bin/python3

# Abilita il runtime NVIDIA per Docker
# ENV NVIDIA_VISIBLE_DEVICES all
# ENV NVIDIA_DRIVER_CAPABILITIES compute,utility

ENV NVIDIA_DISABLE_REQUIRE=1 

# Specifica il comando predefinito per eseguire l'app (modifica in base alla tua applicazione) IL CONTAINER DEVE RIMANERE IN ATTESA QUINDI TAIL DI DEV NULL
CMD ["tail", "-f", "/dev/null"]

