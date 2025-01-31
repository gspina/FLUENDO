from setuptools import setup
from pathlib import Path

HERE = Path(__file__).parent.resolve()

# Carica il numero di versione
ns = {}
with open(HERE / 'my_custom_extension' / '_version.py') as f:
    exec(f.read(), {}, ns)

setup(
    name="my_custom_extension",
    version=ns['__version__'],
    packages=["my_custom_extension"],
    package_data={
        "my_custom_extension": [
            "labextension/**"
        ],
    },
    install_requires=[
        "notebook>=7.0.0",
        "jupyterlab>=4.0.0"
    ],
    zip_safe=False,
    entry_points={
        "jupyter_serverproxy_servers": [
            "my_custom_extension = my_custom_extension:load_jupyter_server_extension"
        ]
    },
)
