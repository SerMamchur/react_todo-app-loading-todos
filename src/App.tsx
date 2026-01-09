/* eslint-disable max-len */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import { getTodos, USER_ID } from './api/todos';
import { Todo } from './types/Todo';
import * as todosServers from '../src/utils/fetchClient';
import Footer from './commponents/Footer';

type Status = 'all' | 'active' | 'completed';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status>('all');
  // const [isEditeing, setIsEditeing] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (errorMessage) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const id = setTimeout(() => {
        setErrorMessage(null);
      }, 3000);

      timeoutRef.current = id;
    }
  }, [errorMessage]);

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(err => {
        setErrorMessage('Unable to load todos');
        throw err;
      });
  }, []);

  function filterTodos(status: Status) {
    if (status === 'active') {
      return [...todos].filter(tod => !tod.completed);
    } else if (status === 'completed') {
      return [...todos].filter(tod => tod.completed);
    }

    return todos;
  }

  const visibleTodos = filterTodos(filterStatus);

  const deleteTodo = (postId: number) => {
    const currentTodos = [...todos];

    todosServers.client.delete(`/todos/${postId}`).catch(error => {
      setTodos(currentTodos);
      setErrorMessage(`Unable to delete a todo`);
      throw error;
    });

    setTodos(currentPosts => currentPosts.filter(post => post.id !== postId));

    // return todosServers.client.delete(`/todos/${postId}`)
  };

  function handleCheckedId(id: number) {
    setTodos(prevTodos =>
      prevTodos.map(todo => {
        if (todo.id === id) {
          return { ...todo, completed: !todo.completed };
        }

        return todo;
      }),
    );
  }

  function handleInput(event: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value);
  }

  function handleSubmitForm(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (inputValue.length < 1) {
      setErrorMessage('Title should not be empty');

      return;
    }

    const todo = {
      userId: USER_ID,
      title: inputValue,
      completed: false,
    };

    todosServers.client
      .post('/todos', todo)
      .then(newPost => {
        setTodos(currentTodos => [...currentTodos, newPost as Todo]);
        setErrorMessage(null);
        setInputValue('');
      })
      .catch(err => {
        // setErrorMessage('Unable to load todos');
        setErrorMessage('Unable to add todo');
        throw err;
      });
  }

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          {todos.length > 0 && (
            <button
              type="button"
              className="todoapp__toggle-all active"
              data-cy="ToggleAllButton"
            />
          )}

          {/* Add a todo on form submit */}
          <form onSubmit={handleSubmitForm}>
            <input
              value={inputValue}
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              onChange={handleInput}
            />
          </form>
        </header>

        {todos.length > 0 && (
          <section className="todoapp__main" data-cy="TodoList">
            {visibleTodos.map(todo => {
              return (
                <div
                  data-cy="Todo"
                  className={todo.completed ? 'todo completed' : 'todo'}
                  key={todo.id}
                >
                  <label className="todo__status-label">
                    <input
                      data-cy="TodoStatus"
                      type="checkbox"
                      className="todo__status"
                      checked={todo.completed}
                      onChange={() => handleCheckedId(todo.id)}
                    />
                  </label>

                  <span data-cy="TodoTitle" className="todo__title">
                    {todo.title}
                  </span>

                  {/* Remove button appears only on hover */}
                  <button
                    type="button"
                    className="todo__remove"
                    data-cy="TodoDelete"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    ×
                  </button>

                  {/* overlay will cover the todo while it is being deleted or updated */}
                  <div data-cy="TodoLoader" className="modal overlay">
                    <div className="modal-background has-background-white-ter" />
                    <div className="loader" />
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Hide the footer if there are no todos */}
        {todos.length > 0 && (
          <Footer
            todos={todos}
            setFilterStatus={setFilterStatus}
            filterStatus={filterStatus}
          />
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}

      <div
        data-cy="ErrorNotification"
        className={
          !errorMessage
            ? 'notification is-danger is-light has-text-weight-normal hidden'
            : 'notification is-danger is-light has-text-weight-normal'
        }
      >
        <button data-cy="HideErrorButton" type="button" className="delete" />
        {/* show only one message at a time */}
        {errorMessage}
        {/* <br />
        Unable to update a todo */}
      </div>
    </div>
  );
};
