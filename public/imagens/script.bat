@echo off
setlocal enabledelayedexpansion

echo Iniciando renomeacao de arquivos...
echo.

REM Loop para arquivos de 001 a 099
for /L %%i in (1,1,99) do (
    REM Formatar o numero com zeros a esquerda (001, 002, etc.)
    if %%i LSS 10 (
        set "oldname=00%%i"
    ) else (
        set "oldname=0%%i"
    )
    
    REM O novo nome sera apenas o numero sem zeros
    set "newname=%%i"
    
    REM Verificar se o arquivo existe (assumindo extensao .gif - ajuste conforme necessario)
    if exist "!oldname!.gif" (
        echo Renomeando: !oldname!.gif para !newname!.gif
        ren "!oldname!.gif" "!newname!.gif"
    )
    
    REM Verificar outros tipos de arquivo comuns
    if exist "!oldname!.jpg" (
        echo Renomeando: !oldname!.jpg para !newname!.jpg
        ren "!oldname!.jpg" "!newname!.jpg"
    )
    
    if exist "!oldname!.png" (
        echo Renomeando: !oldname!.png para !newname!.png
        ren "!oldname!.png" "!newname!.png"
    )
    
    if exist "!oldname!.pdf" (
        echo Renomeando: !oldname!.pdf para !newname!.pdf
        ren "!oldname!.pdf" "!newname!.pdf"
    )
    
    REM Para arquivos sem extensao
    if exist "!oldname!" (
        if not exist "!oldname!.*" (
            echo Renomeando: !oldname! para !newname!
            ren "!oldname!" "!newname!"
        )
    )
)

echo.
echo Renomeacao concluida!
pause