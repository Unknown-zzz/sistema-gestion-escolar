from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Grado, Estudiante, Docente
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    ChangePasswordSerializer, GradoSerializer, EstudianteSerializer, DocenteSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_cursos(request):
    """Cursos del usuario según su rol: docente → cursos asignados, estudiante → cursos matriculados."""
    from courses.serializers import CursoSerializer
    from courses.models import Curso, Matricula

    user = request.user
    if user.role == 'docente':
        try:
            docente = Docente.objects.get(user=user)
            cursos = Curso.objects.filter(docente=docente, estado=True)
        except Docente.DoesNotExist:
            cursos = Curso.objects.none()
    elif user.role == 'estudiante':
        try:
            estudiante = Estudiante.objects.get(user=user)
            matriculas = Matricula.objects.filter(estudiante=estudiante, estado='activo').select_related('curso')
            cursos = [m.curso for m in matriculas if m.curso.estado]
        except Estudiante.DoesNotExist:
            cursos = []
    else:
        cursos = Curso.objects.filter(estado=True)

    return Response(CursoSerializer(cursos, many=True).data)


# ── Auth ──────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({'message': 'Usuario registrado exitosamente.', 'user_id': user.id}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    from django.contrib.auth import authenticate
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    try:
        refresh = RefreshToken(request.data.get('refresh'))
        return Response({'access': str(refresh.access_token)})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    return Response(UserSerializer(request.user).data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Contraseña incorrecta.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Contraseña actualizada exitosamente.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh = RefreshToken(request.data.get('refresh'))
        refresh.blacklist()
        return Response({'message': 'Sesión cerrada exitosamente.'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ── Grados ────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def grados_list(request):
    if request.method == 'GET':
        return Response(GradoSerializer(Grado.objects.filter(estado=True), many=True).data)
    serializer = GradoSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def grado_detail(request, pk):
    try:
        grado = Grado.objects.get(pk=pk)
    except Grado.DoesNotExist:
        return Response({'error': 'Grado no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(GradoSerializer(grado).data)
    if request.method == 'PUT':
        serializer = GradoSerializer(grado, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    grado.estado = False
    grado.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Estudiantes ───────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def estudiantes_list(request):
    if request.method == 'GET':
        qs = Estudiante.objects.select_related('user', 'grado').all()
        estado = request.query_params.get('estado')
        grado_id = request.query_params.get('grado')
        if estado:
            qs = qs.filter(estado=estado)
        if grado_id:
            qs = qs.filter(grado_id=grado_id)
        return Response(EstudianteSerializer(qs, many=True).data)
    serializer = EstudianteSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def estudiante_detail(request, pk):
    try:
        estudiante = Estudiante.objects.select_related('user', 'grado').get(pk=pk)
    except Estudiante.DoesNotExist:
        return Response({'error': 'Estudiante no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(EstudianteSerializer(estudiante).data)
    if request.method == 'PUT':
        serializer = EstudianteSerializer(estudiante, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    estudiante.estado = 'inactivo'
    estudiante.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Docentes ──────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def docentes_list(request):
    if request.method == 'GET':
        qs = Docente.objects.select_related('user').filter(estado='activo')
        return Response(DocenteSerializer(qs, many=True).data)
    serializer = DocenteSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def docente_detail(request, pk):
    try:
        docente = Docente.objects.select_related('user').get(pk=pk)
    except Docente.DoesNotExist:
        return Response({'error': 'Docente no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(DocenteSerializer(docente).data)
    if request.method == 'PUT':
        serializer = DocenteSerializer(docente, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    docente.estado = 'inactivo'
    docente.save()
    return Response(status=status.HTTP_204_NO_CONTENT)
