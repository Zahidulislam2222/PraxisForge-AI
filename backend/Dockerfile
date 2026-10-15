ARG PYTHON_IMAGE
FROM ${PYTHON_IMAGE}
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY requirements.lock /app/requirements.lock
RUN pip install --no-cache-dir --requirement /app/requirements.lock
COPY hermes-pinned.tar.gz /tmp/hermes-pinned.tar.gz
RUN mkdir /opt/hermes && tar -xzf /tmp/hermes-pinned.tar.gz -C /opt/hermes --strip-components=1 && rm /tmp/hermes-pinned.tar.gz
COPY patches /app/patches
RUN python /app/patches/patch_hermes.py /opt/hermes/pyproject.toml
RUN pip install --no-cache-dir --no-deps --editable /opt/hermes
COPY praxis /app/praxis
COPY data /app/data
COPY .env.example /app/.env.example
COPY tests /app/tests
RUN useradd --uid 10001 --user-group --create-home --shell /usr/sbin/nologin praxis
USER 10001:10001
RUN HERMES_HOME=/tmp/hermes-import-check python -c "from run_agent import AIAgent; from pathlib import Path; assert Path.home().is_dir()"
CMD ["python", "-m", "praxis.serve"]
