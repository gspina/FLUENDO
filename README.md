#  Progetto Fluendo

##  Avvio dell'Ambiente Jupyter Lab
Per eseguire i notebook in questa repository, è necessario avviare **Jupyter Lab**. Segui questi passaggi:

1. **Apri il terminale** nella directory del progetto.
2. **Esegui il comando:**
   ```sh
   jupyter lab
   ```
3. **Jupyter Lab si aprirà automaticamente** nel browser, mostrando l'interfaccia grafica con l'elenco dei notebook disponibili.

## Aggiornamento delle Estensioni
Se modifichi l'estensione, è necessario eseguire lo script di build per applicare le modifiche:
```sh
bash extension/test/myextension/src/build_extension.sh
```
Dopo l'esecuzione dello script, ricarica la pagina web di Jupyter Lab per rendere effettive le modifiche.

