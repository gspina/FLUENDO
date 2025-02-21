# Progetto Fluendo

## Avvio dell'Ambiente Jupyter Lab

Per eseguire i notebook in questa repository, è necessario avviare **Jupyter Lab**. Segui questi passaggi:

## Prerequisiti

Installare uv per la gestione degli ambienti virtuali:

```sh
pip install uv
```

Creazione dell'ambiente virtuale e installazione delle dipendenze:

```sh
uv sync
```

Installare node ed npm per la gestione delle estensioni dal sito ufficiale [node.js](https://nodejs.org/en/download/)

## Installazione del kernel jupyter-workflow

Naviga alla cartella jupyter-workflow e installa il kernel:

Installazione in modalità sviluppo:

```sh
uv pip install -e .
```

### Installazione del kernel jupyter-workflow in jupyter lab

```sh
python -m jupyter_workflow.ipython.install
```

## Installazione dell'estensione

Dalla root del progetto, esegui lo script di build per installare l'estensione:

```sh
bash extension/test/myextension/src/build_extension.sh
```

oppure esegui il comando se stai usando uv come gestore del progetto e dell'ambiente virtuale:

```sh
bash extension/test/myextension/src/uv_build_extension.sh
```

## Avvio del Server Jupyter Lab

1. **Apri il terminale** nella directory del progetto.
2. **Esegui il comando:**

   ```sh
   jupyter lab
   ```

3. **Jupyter Lab si aprirà automaticamente** nel browser, mostrando l'interfaccia grafica con l'elenco dei notebook disponibili.

## Aggiornamento delle Estensione

Se modifichi l'estensione, è necessario eseguire lo script di build per applicare le modifiche:

```sh
bash extension/test/myextension/src/build_extension.sh
```

oppure esegui il comando se stai usando uv comegestore del progetto e dell'ambiente virtuale:

```sh
bash extension/test/myextension/src/uv_build_extension.sh
```

Dopo l'esecuzione dello script, ricarica la pagina web di Jupyter Lab per rendere effettive le modifiche.
