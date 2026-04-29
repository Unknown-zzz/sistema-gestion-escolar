from rest_framework import serializers
from .models import Curso, Matricula, Actividad, Calificacion, Asistencia
from accounts.serializers import EstudianteSerializer, DocenteSerializer, GradoSerializer


class CursoSerializer(serializers.ModelSerializer):
    grado = GradoSerializer(read_only=True)
    grado_id = serializers.IntegerField(write_only=True)
    docente = DocenteSerializer(read_only=True)
    docente_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Curso
        fields = ('id', 'nombre', 'codigo', 'grado', 'grado_id', 'docente', 'docente_id',
                  'descripcion', 'numero_horas', 'creditos', 'estado')


class MatriculaSerializer(serializers.ModelSerializer):
    estudiante = EstudianteSerializer(read_only=True)
    estudiante_id = serializers.IntegerField(write_only=True)
    curso = CursoSerializer(read_only=True)
    curso_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Matricula
        fields = ('id', 'estudiante', 'estudiante_id', 'curso', 'curso_id',
                  'periodo', 'fecha_matricula', 'estado')
        read_only_fields = ('id', 'fecha_matricula')


class ActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actividad
        fields = ('id', 'curso', 'nombre', 'descripcion', 'tipo', 'fecha',
                  'ponderacion', 'es_plantilla', 'creada_por', 'created_at')
        read_only_fields = ('id', 'created_at', 'creada_por')


class CalificacionSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.SerializerMethodField()
    actividad_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Calificacion
        fields = ('id', 'estudiante', 'actividad', 'nota', 'fecha_modificacion',
                  'creada_por', 'estudiante_nombre', 'actividad_nombre')
        read_only_fields = ('id', 'fecha_modificacion', 'creada_por',
                            'estudiante_nombre', 'actividad_nombre')

    def get_estudiante_nombre(self, obj):
        return f"{obj.estudiante.user.first_name} {obj.estudiante.user.last_name}"

    def get_actividad_nombre(self, obj):
        return obj.actividad.nombre


class AsistenciaSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Asistencia
        fields = ('id', 'estudiante', 'curso', 'fecha', 'estado', 'motivo',
                  'registrada_por', 'fecha_registro', 'estudiante_nombre')
        read_only_fields = ('id', 'fecha_registro', 'registrada_por', 'estudiante_nombre')

    def get_estudiante_nombre(self, obj):
        return f"{obj.estudiante.user.first_name} {obj.estudiante.user.last_name}"


class AsistenciaBulkItemSerializer(serializers.Serializer):
    estudiante = serializers.IntegerField()
    estado = serializers.ChoiceField(choices=['P', 'F', 'L'])
    motivo = serializers.CharField(required=False, allow_blank=True, default='')
