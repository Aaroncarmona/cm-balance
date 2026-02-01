# Banlance - Portal de Control Financiero

Portal web moderno para control financiero personal desarrollado con Next.js, React y Material UI 3.

## Características

- **Dashboard Interactivo**: Visualización completa de tu situación financiera con gráficas y métricas clave
- **Gestión de Inversiones**: Control completo de tu portafolio de inversiones (Fondos, Acciones, Cripto, Divisas, Ahorro)
- **Operativo (CPC)**: Administración de cuentas por cobrar
- **Control de Deudas**: Seguimiento de créditos y deudas con límites y balances
- **Gestión de Caja**: Registro de efectivo disponible en diferentes ubicaciones
- **Historial de Transacciones**: Registro automático de todos los cambios y movimientos
- **Exportar/Importar**: Soporte para Excel, CSV y JSON para backup y migración de datos
- **Cálculos Automáticos**: P/M (Profit/Loss), acumulados, porcentajes de portafolio
- **Almacenamiento Local**: Todos tus datos se guardan localmente en tu navegador

## Tecnologías Utilizadas

- **Next.js 14+** - Framework React con App Router
- **React 18+** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Material UI 3** - Componentes de interfaz
- **Recharts** - Gráficas interactivas
- **XLSX** - Exportación/Importación de Excel
- **localStorage + IndexedDB** - Persistencia de datos local

## Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd banlance
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso

### Agregar una Inversión

1. Ve a la sección "Inversiones"
2. Click en "Nueva Inversión"
3. Completa el formulario con los datos
4. Los cálculos se realizan automáticamente

### Exportar Datos

1. Ve a cualquier sección (Inversiones, Operativo, Deudas, Caja)
2. Click en "Exportar"
3. Selecciona el formato deseado (Excel, CSV, JSON)
4. El archivo se descargará automáticamente

### Importar Datos

1. Click en "Importar"
2. Selecciona un archivo (Excel, CSV o JSON)
3. Revisa la vista previa
4. Confirma la importación

## Estructura del Proyecto

```
banlance/
├── app/                    # Páginas de la aplicación
│   ├── inversiones/       # Página de inversiones
│   ├── operativo/         # Página de operativo
│   ├── deudas/           # Página de deudas
│   ├── caja/             # Página de caja
│   ├── historial/        # Página de historial
│   └── page.tsx          # Dashboard principal
├── components/            # Componentes React
│   ├── Charts/           # Gráficas
│   ├── Modals/           # Diálogos de formularios
│   └── ...               # Otros componentes
├── lib/                  # Utilidades y lógica de negocio
│   ├── types.ts          # Tipos TypeScript
│   ├── calculations.ts   # Funciones de cálculo
│   ├── storage.ts        # Persistencia de datos
│   ├── export.ts         # Exportación de datos
│   └── import.ts         # Importación de datos
├── hooks/                # Custom React hooks
└── theme/                # Configuración del tema Material UI
```

## Almacenamiento de Datos

Los datos se almacenan localmente en tu navegador:

- **localStorage**: Datos principales (inversiones, operativo, deudas, caja)
- **IndexedDB**: Historial de transacciones y snapshots de backup

### Backup

Se recomienda exportar tus datos regularmente en formato JSON para tener un backup completo.

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## Seguridad

- Todos los datos se almacenan localmente en tu dispositivo
- No se envía ninguna información a servidores externos
- Los datos persisten mientras no limpies el almacenamiento del navegador

## Soporte

Para reportar problemas o sugerir mejoras, por favor abre un issue en el repositorio.

## Licencia

MIT License
