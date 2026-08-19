# Subir la Bitácora de Crítica UI a GitHub — instrucciones para Claude Code

## Qué necesitás hacer vos, antes de abrir Claude Code

1. **Descargá `ui-critique-repo-v1.9.zip`** (te lo compartí en el chat) y
   descomprimilo en tu computadora, en una carpeta fácil de encontrar — por
   ejemplo `~/Descargas/ui-critique-repo/`. Adentro va a estar la carpeta `repo/`
   con todo (`app/`, `docs/`, `README.md`, etc.).

2. **Asegurate de tener acceso de git a tu cuenta de GitHub** desde tu compu. La
   forma más simple: instalar GitHub CLI y correr `gh auth login` una vez, o tener
   ya configurada una SSH key / token en tu git. Si nunca lo configuraste y no
   estás seguro, decile eso mismo a Claude Code al principio — te va a guiar.

3. **Abrí Claude Code** (terminal, VS Code, o la app de escritorio) parado en la
   carpeta donde descomprimiste el zip (`~/Descargas/ui-critique-repo/` en el
   ejemplo).

## El prompt para pegarle a Claude Code

Copiá y pegá esto tal cual:

---

Tenés acceso a git y a internet real, cosa que otra sesión de Claude no tenía —
por eso quedó este paso para vos.

Quiero que subas el proyecto que está en la carpeta `repo/` (al lado de donde estás
parado ahora) al repositorio de GitHub `https://github.com/jlgaleano1-design/withtaste`.

Pasos:
1. Cloná `https://github.com/jlgaleano1-design/withtaste.git` en una carpeta
   temporal separada.
2. Revisá si el repo ya tiene contenido en la raíz (más allá de un README vacío o
   config inicial). Si está esencialmente vacío, copiá el contenido de `repo/`
   directo a la raíz del clone. Si ya tiene otro proyecto adentro, creá una carpeta
   `bitacora-critica-ui/` dentro del clone y poné todo ahí, para no pisar nada
   existente.
3. Copiá todo el contenido de la carpeta `repo/` (que incluye `app/`, `docs/`,
   `README.md`, `.gitignore`) al destino que corresponda según el paso 2.
4. Hacé `git add`, un commit con este mensaje:
   `Agregar MVP v1.9: Bitácora de Crítica UI — pipeline completo, 175 criterios curados, UICrit filtrado, círculo de alimentación`
5. Pusheá a la rama `main`.
6. Al terminar, decime la URL final de GitHub donde quedó cada carpeta principal
   (`app/ui-critique-repo.jsx`, `docs/CRITERIOS-DE-CRITICA.md`, etc.), para que
   pueda verificar que todo llegó bien.

Si en algún paso encontrás un conflicto (por ejemplo el repo no está vacío y no es
obvio dónde colocar las cosas), preguntame antes de sobreescribir nada.

---

## Después de que Claude Code termine

Contame qué te dijo (sobre todo si tuvo que pedirte autenticación en algún punto, o
si encontró contenido existente en el repo) y seguimos desde ahí — por ejemplo, si
querés que ajustemos el README para que quede bien integrado con lo que ya tenías
en `withtaste`.
