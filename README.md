# M-Manager
A intentar hacer la mejor app pa gestionar dinero en todo el mundo


# User Stories

## US-01 — Crear una cuenta
### Value statement
Como usuario nuevo  
quiero crear una cuenta y verificarla con un SMS 
para demostrar que soy una persona real y poder emnpezar a gestionar mis finanzas de forma segura.
### Assumptions / Comments
- El usuario se identifica con un correo electrónico, una contraseña y un número de teléfono.
- Cada correo solo puede pertenecer a una cuenta.
- La verificación por SMS se hace **una sola vez**, al crear la cuenta.
- El sistema envía un código de un solo uso (OTP) al teléfono indicado.
- La cuenta no se considera verificada hasta que el código SMS sea correcto.
- Tras verificar el teléfono, el usuario puede empezar a usar la app.
- La recuperación de contraseña y la 2FA en cada acceso quedan fuera de esta historia.
### Acceptance criteria
- [ ] Un visitante puede iniciar el registro indicando un correo válido, una contraseña que siga los critérios de seguridad requeridos y un número de teléfono.
- [ ] Si el correo ya está registrado, no se crea la cuenta y se informa de que ese correo ya está en uso.
- [ ] Si el correo no es válido, falta algún campo o la contraseña no cumple las reglas, no se crea la cuenta y se indica el motivo.
- [ ] Tras enviar el registro, el usuario recibe un código por SMS en el teléfono indicado.
- [ ] Si introduce el código correcto dentro del tiempo de validez, la cuenta queda verificada y puede usar la app.
- [ ] Si el código es incorrecto o ha caducado, la cuenta no queda verificada y se informa del error.
      
---


## US-02 — Acceder a mi cuenta
### Value statement
Como usuario registrado  
quiero acceder a mi cuenta  
para poder ver y gestionar mis finanzas.
### Assumptions / Comments
- Depende de US-01 (la cuenta ya existe).
- El acceso se hace con el mismo correo y contraseña del registro.
- “He olvidado la contraseña” queda fuera de esta historia.
### Acceptance criteria
- [ ] Un usuario registrado puede acceder a su cuenta con credenciales válidas y ver sus propios datos.
- [ ] Con un correo o contraseña incorrectos, se deniega el acceso y se muestra un error genérico (sin indicar qué campo falla).
- [ ] Si falta un campo obligatorio, no se intenta el acceso y se indican los campos pendientes.
- [ ] Sin sesión activa, no se muestran las páginas y se redirige al usuario a acceder a su cuenta.


