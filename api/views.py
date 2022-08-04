from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import render
from rest_framework import generics, status
from .serializers import RoomSerializer, CreateRoomSerializer, UpdateRoomSerializer
from .models import Room
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse

# Create your views here.


class RoomView(generics.ListAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer


class CreateRoomView(APIView):

    serializer_class = CreateRoomSerializer

    def post(self, request):

        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            host = self.request.session.session_key
            obj, created = Room.objects.update_or_create(
                host=host,
                defaults={
                    "guest_can_pause": guest_can_pause,
                    "votes_to_skip": votes_to_skip
                })
            self.request.session['room_code'] = obj.code
            if created is True:
                return Response(RoomSerializer(obj).data, status=status.HTTP_201_CREATED)
            else:
                return Response(RoomSerializer(obj).data, status=status.HTTP_200_OK)
        return Response({'Bad Request': 'Invalid data...'}, status=status.HTTP_400_BAD_REQUEST)


class GetRoom(APIView):

    lookup_url_kwarg = 'code'

    def get(self, request):

        code = request.GET.get(self.lookup_url_kwarg)

        if code is not None:
            try:
                room_result = Room.objects.get(code=code)
                data = RoomSerializer(room_result).data
                data['is_host'] = self.request.session.session_key == room_result.host
                return Response(data, status=status.HTTP_200_OK)
            except ObjectDoesNotExist:
                return Response({'Room Not Found': 'Invalid Room Code.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'Bad Request': 'Code parameter not found in request'}, status=status.HTTP_400_BAD_REQUEST)


class JoinRoom(APIView):

    lookup_url_kwarg = 'code'

    def post(self, request):

        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        code = request.data.get(self.lookup_url_kwarg)

        if code is not None:
            try:
                Room.objects.get(code=code)
                self.request.session['room_code'] = code
                return Response({'message': 'Room Joined!'}, status=status.HTTP_200_OK)
            except ObjectDoesNotExist:
                return Response({'Bad Request': 'Invalid Room Code'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'Bad Request': 'Invalid post data, did not find a code key'},
                        status=status.HTTP_400_BAD_REQUEST)


class UserInRoom(APIView):

    def get(self, request):

        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        data = {
            'code': self.request.session.get('room_code')
        }
        return JsonResponse(data, status=status.HTTP_200_OK)


class LeaveRoom(APIView):

    def post(self, request):
        if 'room_code' in self.request.session:
            self.request.session.pop('room_code')
            host_id = self.request.session_key
            try:
                room_result = Room.objects.get(host=host_id)
                room_result.delete()
            except ObjectDoesNotExist:
                pass
        return Response({'Message': 'Success'}, status=status.HTTP_200_OK)


class UpdateRoom(APIView):

    serializer_class = UpdateRoomSerializer
    lookup_url_kwarg = 'code'

    def put(self, request):

        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            code = serializer.data.get('code')

            try:
                room = Room.objects.get(code=code)
                user_id = self.request.session.session_key
                if room.host != user_id:
                    return Response({'Message': 'You are not the host of this room.'}, status=status.HTTP_403_FORBIDDEN)
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip
                room.save()
                return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)
            except ObjectDoesNotExist:
                return Response({'Message': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'Bad Request': "Invalid Data..."}, status=status.HTTP_400_BAD_REQUEST)
