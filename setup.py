from setuptools import setup, find_packages

setup(
    name="ds_maker",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "opencv-python",
        "numpy",
        "tqdm",
        "loguru",
        "pynput",
        "pyyaml"
    ],
    entry_points={
        'console_scripts': [
            'ds-convert=ds_maker.convert:main',
            'ds-preview=ds_maker.preview:main',
            'ds-split=ds_maker.split:main',
        ],
    },
    author="Your Name",
    description="A toolkit for converting video annotations to COCO format",
    long_description=open("ds_maker/README.md").read(),
    long_description_content_type="text/markdown",
    python_requires=">=3.7",
) 