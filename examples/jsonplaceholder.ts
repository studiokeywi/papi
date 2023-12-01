import { $DELETE, $GET, $PATCH, $POST, $PUT, PAPIBuilder } from '../lib/index.js';
import { invariant } from './utility.js';

const albumShape = { userId: 0, id: 0, title: '' };
const commentShape = { postId: 0, id: 0, name: '', email: '', body: '' };
const photoShape = { albumId: 0, id: 0, title: '', url: '', thumbnailUrl: '' };
const postShape = { userId: 0, id: 0, title: '', body: '' };
const todoShape = { userId: 0, id: 0, title: '', completed: false };
const userQueryShape = { id: 0, name: '', username: '', email: '' };
const userAddressGeoShape = { lat: '', lng: '' };
const userAddressCompany = { name: '', catchphrase: '', bs: '' };
const userAddressShape = {
  street: '',
  suite: '',
  city: '',
  zipcode: '',
  geo: userAddressGeoShape,
  phone: '',
  website: '',
  company: userAddressCompany,
};
const userShape = { ...userQueryShape, address: userAddressShape };

const papi = new PAPIBuilder('https://jsonplaceholder.typicode.com')
  .path('albums', albums =>
    albums
      .body(albumShape)
      .endpoint($GET, [albumShape])
      .endpoint($POST, albumShape)
      .error({})
      .query(albumShape, album => album.endpoint($GET, [albumShape]).error({}))
      .slug(albumId =>
        albumId
          .body(albumShape)
          .endpoint($GET, albumShape)
          .endpoint($DELETE, {})
          .endpoint($PATCH, albumShape)
          .endpoint($PUT, albumShape)
          .error({})
          .path('photos', photos => photos.endpoint($GET, [photoShape]).error({}))
      )
  )
  .path('comments', comments =>
    comments
      .body(commentShape)
      .endpoint($GET, [commentShape])
      .endpoint($POST, commentShape)
      .error({})
      .query(commentShape, comment => comment.endpoint($GET, [commentShape]).error({}))
      .slug(commentId =>
        commentId
          .body(commentShape)
          .endpoint($GET, albumShape)
          .endpoint($DELETE, {})
          .endpoint($PATCH, albumShape)
          .endpoint($PUT, albumShape)
          .error({})
      )
  )
  .path('photos', photos =>
    photos
      .body(photoShape)
      .endpoint($GET, [photoShape])
      .endpoint($POST, photoShape)
      .error({})
      .query(photoShape, photo => photo.endpoint($GET, [photoShape]).error({}))
      .slug(photoId =>
        photoId
          .body(photoShape)
          .endpoint($GET, photoShape)
          .endpoint($DELETE, {})
          .endpoint($PATCH, photoShape)
          .endpoint($PUT, photoShape)
          .error({})
      )
  )
  .path('posts', posts =>
    posts
      .body(postShape)
      .endpoint($GET, [postShape])
      .endpoint($POST, postShape)
      .error({})
      .query(postShape, post => post.endpoint($GET, [postShape]).error({}))
      .slug(postId =>
        postId
          .body(postShape)
          .endpoint($GET, postShape)
          .endpoint($DELETE, {})
          .endpoint($PATCH, postShape)
          .endpoint($PUT, postShape)
          .error({})
          .path('comments', comments => comments.endpoint($GET, [commentShape]).error({}))
      )
  )
  .path('todo', todo =>
    todo
      .body(todoShape)
      .endpoint($GET, [todoShape])
      .endpoint($POST, todoShape)
      .error({})
      .query(todoShape, todo => todo.endpoint($GET, [todoShape]).error({}))
      .slug(todoId =>
        todoId
          .body(todoShape)
          .endpoint($GET, todoShape)
          .endpoint($DELETE, {})
          .endpoint($PATCH, todoShape)
          .endpoint($PUT, todoShape)
          .error({})
      )
  )
  .path('user', user =>
    user
      .body(userShape)
      .endpoint($GET, [userShape])
      .endpoint($POST, userShape)
      .error({})
      .query(userQueryShape, user => user.endpoint($GET, [userShape]).error({}))
      .slug(userId =>
        userId
          .body(userShape)
          .endpoint($GET, userShape)
          .endpoint($DELETE, {})
          .endpoint($PATCH, userShape)
          .endpoint($PUT, userShape)
          .error({})
          .path('albums', albums => albums.endpoint($GET, [albumShape]).error({}))
          .path('posts', posts => posts.endpoint($GET, [postShape]).error({}))
          .path('todos', todos => todos.endpoint($GET, [todoShape]).error({}))
      )
  );

console.group('start tests');
const papiTool = papi.build();

console.debug('post empty album data');
const newAlbum = await papiTool.albums[$POST]({ data: { userId: 1, id: 420, title: 'flarp' } });
invariant('userId' in newAlbum);
console.log(newAlbum);

console.debug('get all albums, show first');
const allAlbums = await papiTool.albums[$GET]();
invariant('length' in allAlbums);
const [firstAlbum] = allAlbums;
console.log(firstAlbum);

console.debug('get user 3 albums, show first');
const user3Albums = await papiTool.albums[$GET]({ query: { userId: 3 } });
invariant('length' in user3Albums);
const [user3Album] = user3Albums;
console.log(user3Album);

console.debug('delete album 3');
const deleted = await papiTool.albums['3'][$DELETE]();
console.log(deleted);

console.debug('get album 3 photos, show first');
const album3Photos = await papiTool.albums[3].photos[$GET]();
invariant('length' in album3Photos);
const [album3Photo] = album3Photos;
console.log(album3Photo);
console.groupEnd();
