from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from .models import Curso, Matricula, Actividad, Calificacion, Asistencia
from .serializers import (
    CursoSerializer, MatriculaSerializer, ActividadSerializer,
    CalificacionSerializer, AsistenciaSerializer, AsistenciaBulkItemSerializer,
)
from accounts.models import Estudiante, Docente
from accounts.serializers import EstudianteSerializer


# ── Cursos ────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def cursos_list(request):
    if request.method == 'GET':
        cursos = Curso.objects.filter(estado=True)
        serializer = CursoSerializer(cursos, many=True)
        return Response(serializer.data)
    serializer = CursoSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def curso_detail(request, pk):
    try:
        curso = Curso.objects.get(pk=pk)
    except Curso.DoesNotExist:
        return Response({'error': 'Curso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(CursoSerializer(curso).data)
    if request.method == 'PUT':
        serializer = CursoSerializer(curso, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    curso.estado = False
    curso.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def curso_estudiantes(request, pk):
    """Estudiantes matriculados en un curso."""
    try:
        curso = Curso.objects.get(pk=pk)
    except Curso.DoesNotExist:
        return Response({'error': 'Curso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    matriculas = Matricula.objects.filter(curso=curso, estado='activo').select_related('estudiante__user')
    estudiantes = [m.estudiante for m in matriculas]
    return Response(EstudianteSerializer(estudiantes, many=True).data)


# ── Matrículas ─────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def matriculas_list(request):
    if request.method == 'GET':
        qs = Matricula.objects.select_related('estudiante', 'curso').all()
        return Response(MatriculaSerializer(qs, many=True).data)
    serializer = MatriculaSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Actividades ────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def curso_actividades(request, pk):
    """Actividades de un curso específico."""
    try:
        curso = Curso.objects.get(pk=pk)
    except Curso.DoesNotExist:
        return Response({'error': 'Curso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        actividades = Actividad.objects.filter(curso=curso, es_plantilla=False).order_by('fecha', 'created_at')
        return Response(ActividadSerializer(actividades, many=True).data)

    data = request.data.copy()
    data['curso'] = pk
    serializer = ActividadSerializer(data=data)
    if serializer.is_valid():
        serializer.save(creada_por=request.user, curso=curso)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def actividad_detail(request, pk):
    try:
        actividad = Actividad.objects.get(pk=pk)
    except Actividad.DoesNotExist:
        return Response({'error': 'Actividad no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = ActividadSerializer(actividad, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    actividad.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def guardar_plantilla(request, pk):
    """Duplica una actividad de un curso como plantilla."""
    try:
        actividad = Actividad.objects.get(pk=pk)
    except Actividad.DoesNotExist:
        return Response({'error': 'Actividad no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
    plantilla = Actividad.objects.create(
        curso=None,
        nombre=actividad.nombre,
        descripcion=actividad.descripcion,
        tipo=actividad.tipo,
        ponderacion=actividad.ponderacion,
        es_plantilla=True,
        creada_por=request.user,
    )
    return Response(ActividadSerializer(plantilla).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_plantillas(request):
    """Plantillas del docente autenticado."""
    plantillas = Actividad.objects.filter(creada_por=request.user, es_plantilla=True).order_by('nombre')
    return Response(ActividadSerializer(plantillas, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def usar_plantilla(request, curso_pk, plantilla_pk):
    """Crea una actividad en el curso basada en una plantilla."""
    try:
        curso = Curso.objects.get(pk=curso_pk)
        plantilla = Actividad.objects.get(pk=plantilla_pk, es_plantilla=True)
    except (Curso.DoesNotExist, Actividad.DoesNotExist):
        return Response({'error': 'Recurso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    actividad = Actividad.objects.create(
        curso=curso,
        nombre=plantilla.nombre,
        descripcion=plantilla.descripcion,
        tipo=plantilla.tipo,
        ponderacion=plantilla.ponderacion,
        es_plantilla=False,
        creada_por=request.user,
    )
    return Response(ActividadSerializer(actividad).data, status=status.HTTP_201_CREATED)


# ── Calificaciones (centro de notas) ──────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def centro_notas(request, pk):
    """Devuelve el grid de notas: {actividades, filas de estudiantes con notas}.
    Si el usuario es estudiante, solo devuelve su propia fila."""
    try:
        curso = Curso.objects.get(pk=pk)
    except Curso.DoesNotExist:
        return Response({'error': 'Curso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    actividades = Actividad.objects.filter(curso=curso, es_plantilla=False).order_by('fecha', 'created_at')
    matriculas = Matricula.objects.filter(curso=curso, estado='activo').select_related('estudiante__user')

    if request.user.role == 'estudiante':
        try:
            estudiante = Estudiante.objects.get(user=request.user)
            matriculas = matriculas.filter(estudiante=estudiante)
        except Estudiante.DoesNotExist:
            matriculas = Matricula.objects.none()

    calificaciones = Calificacion.objects.filter(actividad__in=actividades)

    cal_map = {}
    for c in calificaciones:
        cal_map[(c.estudiante_id, c.actividad_id)] = c.nota

    filas = []
    for m in matriculas:
        e = m.estudiante
        notas = {str(a.id): cal_map.get((e.id, a.id)) for a in actividades}
        filas.append({
            'estudiante_id': e.id,
            'nombre': f"{e.user.first_name} {e.user.last_name}",
            'notas': notas,
        })

    return Response({
        'actividades': ActividadSerializer(actividades, many=True).data,
        'filas': filas,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def guardar_nota(request):
    """Guarda o actualiza una nota puntual: {estudiante, actividad, nota}."""
    estudiante_id = request.data.get('estudiante')
    actividad_id = request.data.get('actividad')
    nota = request.data.get('nota')

    try:
        estudiante = Estudiante.objects.get(pk=estudiante_id)
        actividad = Actividad.objects.get(pk=actividad_id)
    except (Estudiante.DoesNotExist, Actividad.DoesNotExist):
        return Response({'error': 'Recurso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    obj, _ = Calificacion.objects.update_or_create(
        estudiante=estudiante,
        actividad=actividad,
        defaults={'nota': nota, 'creada_por': request.user},
    )
    return Response(CalificacionSerializer(obj).data)


# ── Asistencia ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def asistencia_curso(request, pk):
    """Lista asistencias de un curso, opcionalmente filtradas por fecha."""
    fecha = request.query_params.get('fecha')
    qs = Asistencia.objects.filter(curso_id=pk).select_related('estudiante__user')
    if fecha:
        qs = qs.filter(fecha=fecha)
    return Response(AsistenciaSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_asistencia_bulk(request, pk):
    """Registra o actualiza la asistencia de varios estudiantes para una fecha.
    Body: { fecha: 'YYYY-MM-DD', registros: [{estudiante, estado, motivo}] }
    """
    try:
        curso = Curso.objects.get(pk=pk)
    except Curso.DoesNotExist:
        return Response({'error': 'Curso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    fecha = request.data.get('fecha')
    registros = request.data.get('registros', [])

    if not fecha:
        return Response({'error': 'Se requiere la fecha.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = AsistenciaBulkItemSerializer(data=registros, many=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    resultado = []
    for r in serializer.validated_data:
        try:
            estudiante = Estudiante.objects.get(pk=r['estudiante'])
        except Estudiante.DoesNotExist:
            continue
        obj, _ = Asistencia.objects.update_or_create(
            estudiante=estudiante,
            curso=curso,
            fecha=fecha,
            defaults={'estado': r['estado'], 'motivo': r.get('motivo', ''), 'registrada_por': request.user},
        )
        resultado.append(AsistenciaSerializer(obj).data)

    return Response(resultado, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resumen_asistencia(request, pk):
    """Resumen de faltas y licencias por estudiante en un curso.
    Si el usuario es estudiante, solo devuelve su propio resumen."""
    try:
        curso = Curso.objects.get(pk=pk)
    except Curso.DoesNotExist:
        return Response({'error': 'Curso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    matriculas = Matricula.objects.filter(curso=curso, estado='activo').select_related('estudiante__user')

    if request.user.role == 'estudiante':
        try:
            estudiante = Estudiante.objects.get(user=request.user)
            matriculas = matriculas.filter(estudiante=estudiante)
        except Estudiante.DoesNotExist:
            matriculas = Matricula.objects.none()
    resultado = []
    for m in matriculas:
        e = m.estudiante
        faltas = Asistencia.objects.filter(estudiante=e, curso=curso, estado='F').count()
        licencias = Asistencia.objects.filter(estudiante=e, curso=curso, estado='L').count()
        presentes = Asistencia.objects.filter(estudiante=e, curso=curso, estado='P').count()
        resultado.append({
            'estudiante_id': e.id,
            'nombre': f"{e.user.first_name} {e.user.last_name}",
            'presentes': presentes,
            'faltas': faltas,
            'licencias': licencias,
        })
    return Response(resultado)
